import { WebviewProvider } from "@core/webview"
import { HostBridgeClientProvider } from "./host-provider-types"
import { WebviewProviderType } from "@/shared/webview/types"
import * as vscode from "vscode"

/**
 * A factory function that creates WebviewProvider instances
 */
export type WebviewProviderFactory = (
	context: vscode.ExtensionContext,
	outputChannel: vscode.OutputChannel,
	providerType: WebviewProviderType,
) => WebviewProvider

let _webviewProviderFactory: WebviewProviderFactory | undefined
let _hostBridgeProvider: HostBridgeClientProvider | undefined

export var isSetup: boolean = false

export function initializeHostProviders(
	webviewProviderFactory: WebviewProviderFactory,
	hostBridgeProvider: HostBridgeClientProvider,
) {
	_webviewProviderFactory = webviewProviderFactory
	_hostBridgeProvider = hostBridgeProvider
	isSetup = true
}

export function createWebviewProvider(
	context: vscode.ExtensionContext,
	outputChannel: vscode.OutputChannel,
	providerType: WebviewProviderType,
): WebviewProvider {
	if (!_webviewProviderFactory) {
		throw Error("Host providers not initialized")
	}
	return _webviewProviderFactory(context, outputChannel, providerType)
}

export function getHostBridgeProvider(): HostBridgeClientProvider {
	if (!_hostBridgeProvider) {
		throw Error("Host providers not initialized")
	}
	return _hostBridgeProvider
}
