import { FunctionComponent, PropsWithChildren } from "react"
import TimeseriesSelectionWidget from "../NwbAcquisitionItemView/TimeseriesSelectionWidget"
import { RemoteH5Group } from "../RemoteH5File/RemoteH5File"

type Props = {
    width: number
    height: number
    path: string
    group: RemoteH5Group | undefined
    viewName: string
}

const NeurodataItemViewLeftPanel: FunctionComponent<Props> = ({width, height, path, group, viewName}) => {
    return (
        <div>
            <table className="nwb-table">
                <tbody>
                    <tr>
                        <td>Item path</td>
                        <td>{path}</td>
                    </tr>
                    <tr>
                        <td>Neurodata type</td>
                        <td>{group?.attrs?.neurodata_type}</td>
                    </tr>
                    <tr>
                        <td>Description</td>
                        <td>{group?.attrs?.description}</td>
                    </tr>
                    <tr>
                        <td>Comments</td>
                        <td><Abbreviate>{group?.attrs?.comments}</Abbreviate></td>
                    </tr>
                    <tr>
                        <td>View</td>
                        <td>{viewName}</td>
                    </tr>
                </tbody>
            </table>
            <TimeseriesSelectionWidget />
        </div>
    )
}

export const Abbreviate: FunctionComponent<PropsWithChildren> = ({children}) => {
    return (
        <span>{abbreviateText(children as string)}</span>
    )
}

const abbreviateText = (text: string | undefined) => {
    if (text === undefined) return ''
    const maxLen = 300
    if (text.length <= maxLen) return text
    const abbrev = text.slice(0, maxLen) + '...'
    return abbrev
}

export default NeurodataItemViewLeftPanel