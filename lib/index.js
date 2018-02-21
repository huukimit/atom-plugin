/** @babel */
import App from './panes/app'
import showPanel from './panels/show-panel'
import { open_workspace, open_post_editor } from './helpers'
import { TextEditor } from 'atom'
import VibloEditor from './editor'
import PostManager from './editor/post-manager'
import { openPublishForm } from './editor/publish-form/loader'
import { ATOM_APP_URI, ATOM_PREVIEW_URI, REGEX_POST_EDITOR } from './config'
import togglePreview from './panes/md-preview/toggle'
import VibloMarkdownPreviewPane from './panes/md-preview'
import VibloAuth from './auth'

let appInstance = null
window.PostManager = new PostManager()
const Auth = window.Auth = new VibloAuth()

export default {
    createAppInstance (params) {
        if (appInstance === null) {
            appInstance = new App(params)
            Auth.initializeSDK()
            Auth.onDidChangeAuth(() => appInstance.initializePanels())
        }

        return appInstance
    },

    createVibloMarkdownPreviewPane (options) {
        const { uri, editorId } = options
        Auth.initializeSDK()

        // Found editorId:
        if (editorId) {
            return new VibloMarkdownPreviewPane(options)
        }

        // Not found editorId when click ctrl+alt+v:
        let pathFromURI = decodeURI(uri.split('viblo-preview://md/')[1])
        const editorMatch = /^editor\/([a-zA-Z0-9]+)/.exec(pathFromURI)
        options.editorId = editorMatch ? editorMatch[1] : null

        return new VibloMarkdownPreviewPane(options)
    },

    activate () {
        // Add workspace opener:
        this.addWorkspaceOpener()
        // Add post editor open:
        this.addPostEditorOpener()
        // Register command that toggles this viewREGEX_POST_EDITOR
        this.registerCommands()
    },

    addWorkspaceOpener () {
        // Current URI is matched with correct Panel by Opener:
        atom.workspace.addOpener((uri) => {
            // Is Post editor request:
            if (REGEX_POST_EDITOR.exec(uri)) {
                return // Post Editor Opener will handle it.
            }

            if (uri.startsWith(ATOM_PREVIEW_URI)) {
                return this.createVibloMarkdownPreviewPane({ uri })
            }

            if (!uri.startsWith(ATOM_APP_URI)) {
                return
            }

            // Create and show Viblo panels:
            appInstance = this.createAppInstance({ uri })
            showPanel(appInstance, uri)

            return appInstance
        })
    },

    addPostEditorOpener () {
        // elsint-disable-next-line no-undef
        atom.workspace.observeTextEditors((editor) => {
            if (editor) {
                const match = REGEX_POST_EDITOR.exec(editor.getPath())
                const hashId = match ? match[2] : null
                // Always exists hashId in VibloEditor
                if (hashId) {
                    return new VibloEditor({ editor, hashId, emptyOnNew: false })
                }
            }
        })
    },

    registerCommands () {
        // eslint-disable-next-line no-undef
        atom.commands.add('atom-workspace', {
            'viblo:about': () => open_workspace('/about'),
            'viblo:open': () => open_workspace('/publish-posts'),
            'viblo:settings': () => open_workspace('/settings'),
            'viblo:create-post': () => open_post_editor()
        })
        atom.commands.add('atom-text-editor[data-grammar*="gfm"]', {
            'viblo:save-post': async () => await openPublishForm(atom.workspace.getActiveTextEditor().id),
            'viblo:toggle-preview': () => togglePreview()
        })
    }
}