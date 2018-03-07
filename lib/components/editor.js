/** @babel */
import { TextBuffer } from 'atom'
import { getPost } from 'viblo-sdk/api/posts'
import fs from 'fs-plus'
import _defer from 'lodash/defer'
import _find from 'lodash/find'

export default class Editor {
    constructor ({ path, hashId }) {
        this.path = path
        this.hashId = hashId
        this.id = this.hashId || 'untitled'
    }

    build () {
        this.editor = this.buildTextEditor()

        this.fetch().then((post) => {
            if (post) {
                this.editor.getTitle = () => `Viblo - ${post.title}`
                this.editor.emitter.emit('did-change-title')
                this.editor.setText(post.contents)
                this.editor.save()
            }
        })

        _defer(() => this.syncScroll())

        return this.editor
    }

    buildTextEditor () {
        const text = fs.isFileSync(this.path)
            ? decodeURIComponent(escape(String.fromCharCode(...fs.readFileSync(this.path))))
            : ''
        const buffer = new TextBuffer({ filePath: this.path, text })
        const editor = atom.workspace.buildTextEditor({
            buffer,
            id: this.id,
            autoHeight: false
        })
        editor.getTitle = () => 'Viblo - untitled'
        editor.serialize = () => ({
            deserializer: 'VibloEditor',
            path: this.path
        })
        editor.getPath = () => this.path
        editor.getIconName = () => 'viblo-logo'
        editor.element.classList.add('viblo-editor')
        editor.setText(buffer.getText())
        editor.save()

        return editor
    }

    syncScroll () {
        if (!this.editor) {
            return
        }

        const isVibloPreview = (item) => item instanceof require('../panes/md-preview')
        const panes = atom.workspace.getPaneItems()
        const previewPane = _find(panes, item => isVibloPreview(item) && item.filePath === this.editor.getPath())

        const editorElement = atom.views.getView(this.editor)
        const newScrollTop = editorElement.getScrollTop() + editorElement.getHeight()
        editorElement.setScrollTop(newScrollTop)
    }

    async fetch () {
        if (!this.hashId) {
            return
        }

        const response = await getPost(this.hashId)
        const post = PostManager.normalizePost(response.data)
        // Put to store for publish form:
        PostManager.put({
            [this.hashId]: post
        })

        return post
    }
}
