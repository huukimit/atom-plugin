/** @babel */
import { REGEX_SYSTEM_PANEL } from '../config'
import { parse_query_string } from '../helpers'
import panels from '../config/panels'
import _find from 'lodash/find'

export default (appInstance, uri) => {
    const match = REGEX_SYSTEM_PANEL.exec(uri)
    const panelId = match ? match[1] : null
    const query = match ? parse_query_string(match[2]) : null
    const panel = _find(panels, (item) => item.id === panelId)
    if (panel) {
        appInstance.showPanel(panel.id, { uri, query })
    } else {
        console.warn(
            'Panel not found. Please add panel information in ./config/panels.js for this.',
            'Data matched:',
            {id: panelId, param}
        )
    }
}
