import * as path from "path"
import * as os from "os"
import * as vscode from "vscode"
import { arePathsEqual } from "@utils/path"
import { getHostBridgeProvider } from "@/hosts/host-providers"
import { ShowTextDocumentRequest, ShowTextDocumentOptions, ShowMessageRequest, ShowMessageType } from "@/shared/proto/host/window"
import { writeFile } from "@utils/fs"

export async function openImage(dataUri: string) {
	const matches = dataUri.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
	if (!matches) {
		getHostBridgeProvider().windowClient.showMessage(
			ShowMessageRequest.create({
				type: ShowMessageType.ERROR,
				message: "Invalid data URI format",
			}),
		)
		return
	}
	const [, format, base64Data] = matches
	const imageBuffer = Buffer.from(base64Data, "base64")
	const tempFilePath = path.join(os.tmpdir(), `temp_image_${Date.now()}.${format}`)
	try {
		await writeFile(tempFilePath, new Uint8Array(imageBuffer))
		await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(tempFilePath))
	} catch (error) {
		getHostBridgeProvider().windowClient.showMessage(
			ShowMessageRequest.create({
				type: ShowMessageType.ERROR,
				message: `Error opening image: ${error}`,
			}),
		)
	}
}

export async function openFile(absolutePath: string) {
	try {
		const uri = vscode.Uri.file(absolutePath)

		// Check if the document is already open in a tab group that's not in the active editor's column. If it is, then close it (if not dirty) so that we don't duplicate tabs
		try {
			for (const group of vscode.window.tabGroups.all) {
				const existingTab = group.tabs.find(
					(tab) => tab.input instanceof vscode.TabInputText && arePathsEqual(tab.input.uri.fsPath, uri.fsPath),
				)
				if (existingTab) {
					const activeColumn = vscode.window.activeTextEditor?.viewColumn
					const tabColumn = vscode.window.tabGroups.all.find((group) => group.tabs.includes(existingTab))?.viewColumn
					if (activeColumn && activeColumn !== tabColumn && !existingTab.isDirty) {
						await vscode.window.tabGroups.close(existingTab)
					}
					break
				}
			}
		} catch {} // not essential, sometimes tab operations fail

		const document = await vscode.workspace.openTextDocument(uri)
		await getHostBridgeProvider().windowClient.showTextDocument(
			ShowTextDocumentRequest.create({
				path: document.uri.fsPath,
				options: ShowTextDocumentOptions.create({ preview: false }),
			}),
		)
	} catch (error) {
		getHostBridgeProvider().windowClient.showMessage(
			ShowMessageRequest.create({
				type: ShowMessageType.ERROR,
				message: `Could not open file!`,
			}),
		)
	}
}
