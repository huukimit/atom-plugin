/** @babel */
import { CompositeDisposable } from 'atom'

export default class SyncScroll {
    constructor (editor1, editor2, syncHorizontalScroll) {
        this._syncHorizontalScroll = syncHorizontalScroll
        this._subscriptions = new CompositeDisposable()
        this._syncInfo = [
            {
                editor: editor1,
                editorView: atom.views.getView(editor1),
                scrolling: false,
            },
            //{
            //    editor: editor2,
            //    editorView: atom.views.getView(editor2),
            //    scrolling: false,
            //}
        ]

        this._syncInfo.forEach((editorInfo, i) => {
            //console.log(editorInfo)
            // Note that 'onDidChangeScrollTop' isn't technically in the public API.
            this._subscriptions.add(editorInfo.editorView.onDidChangeScrollTop(() => this._scrollPositionChanged(i)))
            // Note that 'onDidChangeScrollLeft' isn't technically in the public API.
            if (this._syncHorizontalScroll) {
                this._subscriptions.add(editorInfo.editorView.onDidChangeScrollLeft(() => this._scrollPositionChanged(i)))
            }
            // bind this so that the editors line up on start of package
            this._subscriptions.add(editorInfo.editor.emitter.on('did-change-scroll-top', () => this._scrollPositionChanged(i)))
        })
    }

    _scrollPositionChanged (changeScrollIndex) {
        let thisInfo = this._syncInfo[changeScrollIndex]
        let otherInfo = this._syncInfo[1 - changeScrollIndex]

        if (thisInfo.scrolling) {
            return
        }

        otherInfo.scrolling = true
        try {
            otherInfo.editorView.setScrollTop(thisInfo.editorView.getScrollTop())
            if (this._syncHorizontalScroll) {
                otherInfo.editorView.setScrollLeft(thisInfo.editorView.getScrollLeft())
            }
        } catch (e) {
            // console.log(e);
        }
        otherInfo.scrolling = false
    }

    dispose () {
        if (this._subscriptions) {
            this._subscriptions.dispose()
            this._subscriptions = null
        }
    }

    syncPositions () {
        const activeTextEditor = atom.workspace.getActiveTextEditor()
        this._syncInfo.forEach((editorInfo) => {
            if (editorInfo.editor == activeTextEditor) {
                editorInfo.editor.emitter.emit('did-change-scroll-top', editorInfo.editorView.getScrollTop())
            }
        })
    }
}
