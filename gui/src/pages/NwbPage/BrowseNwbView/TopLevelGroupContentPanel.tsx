import { FunctionComponent, useEffect, useMemo, useReducer } from "react"
import { RemoteH5Dataset, RemoteH5File, RemoteH5Group } from "../RemoteH5File/RemoteH5File"
import { valueToString } from "./BrowseNwbView"
import './nwb-attributes-table.css'

type Props = {
    name: string
    group: RemoteH5Group
    nwbFile: RemoteH5File
    excludeGroups?: boolean
}

type GroupsDatasetsState = {
    groups: RemoteH5Group[]
    datasets: RemoteH5Dataset[]
    datasetDatas: {[key: string]: any}
    expandedGroupPaths: string[]
    expandedDatasetPaths: string[]
}

type GroupsDatasetsAction = {
    type: 'addGroup'
    group: RemoteH5Group
} | {
    type: 'addDataset'
    dataset: RemoteH5Dataset
} | {
    type: 'expandGroup'
    path: string
} | {
    type: 'collapseGroup'
    path: string
} | {
    type: 'expandDataset'
    path: string
} | {
    type: 'collapseDataset'
    path: string
} | {
    type: 'setDatasetData'
    path: string
    data: any
}

const groupsDatasetsReducer = (state: GroupsDatasetsState, action: GroupsDatasetsAction): GroupsDatasetsState => {
    switch (action.type) {
        case 'addGroup':
            return {
                ...state,
                groups: [...state.groups.filter(g => (g.path !== action.group.path)), action.group]
            }
        case 'addDataset':
            return {
                ...state,
                datasets: [...state.datasets.filter(d => (d.path !== action.dataset.path)), action.dataset]
            }
        case 'expandGroup':
            return {
                ...state,
                expandedGroupPaths: [...state.expandedGroupPaths.filter(p => (p !== action.path)), action.path]
            }
        case 'collapseGroup':
            return {
                ...state,
                expandedGroupPaths: [...state.expandedGroupPaths.filter(p => (p !== action.path))]
            }
        case 'expandDataset':
            return {
                ...state,
                expandedDatasetPaths: [...state.expandedDatasetPaths.filter(p => (p !== action.path)), action.path]
            }
        case 'collapseDataset':
            return {
                ...state,
                expandedDatasetPaths: [...state.expandedDatasetPaths.filter(p => (p !== action.path))]
            }
        case 'setDatasetData':
            return {
                ...state,
                datasetDatas: {
                    ...state.datasetDatas,
                    [action.path]: action.data
                }
            }
        default:
            throw Error('Unexpected action type: ' + (action as any).type)
    }
}

type TableItem = {
    key: string
    type: 'group'
    name: string
    path: string
    expanded: boolean
    indent: number
} | {
    key: string
    type: 'dataset'
    name: string
    path: string
    expanded: boolean
    indent: number
} | {
    key: string
    type: 'attribute'
    name: string
    value: any
    indent: number
} | {
    key: string
    type: 'dataset-info'
    path: string
    dataset: RemoteH5Dataset
    data?: any
    indent: number
}

const TopLevelGroupContentPanel: FunctionComponent<Props> = ({group, nwbFile, excludeGroups}) => {
    const [groupsDatasetsState, groupsDatasetsDispatch] = useReducer(groupsDatasetsReducer, {groups: [], datasets: [], expandedGroupPaths: [], expandedDatasetPaths: [], datasetDatas: {}})
    useEffect(() => {
        groupsDatasetsDispatch({type: 'addGroup', group})
    }, [group])
    useEffect(() => {
        const process = async () => {
            for (const path of groupsDatasetsState.expandedGroupPaths) {
                const g = groupsDatasetsState.groups.find(g => (g.path === path))
                if (!g) {
                    const newGroup = await nwbFile.getGroup(path)
                    groupsDatasetsDispatch({type: 'addGroup', group: newGroup})
                    return // return after loading one, because then the state will change and this will be called again
                }       
            }
            for (const path of groupsDatasetsState.expandedDatasetPaths) {
                const d = groupsDatasetsState.datasets.find(d => (d.path === path))
                if (!d) {
                    const newDataset = await nwbFile.getDataset(path)
                    groupsDatasetsDispatch({type: 'addDataset', dataset: newDataset})
                    return // return after loading one, because then the state will change and this will be called again
                }
            }
            for (const path of groupsDatasetsState.expandedDatasetPaths) {
                const d = groupsDatasetsState.datasets.find(d => (d.path === path))
                if (d) {
                    if (!(path in groupsDatasetsState.datasetDatas)) {
                        if (product(d.shape) <= 100) {
                            const data = await nwbFile.getDatasetData(path, {})
                            groupsDatasetsDispatch({type: 'setDatasetData', path, data})
                            return // return after loading one, because then the state will change and this will be called again
                        }
                    }
                }
            }
        }
        process()
    }, [groupsDatasetsState.expandedGroupPaths, groupsDatasetsState.expandedDatasetPaths, groupsDatasetsState.groups, groupsDatasetsState.datasets, nwbFile, groupsDatasetsState.datasetDatas])

    const tableItems = useMemo(() => {
        const ret: TableItem[] = []
        const processExpandedGroup = (path: string, indent: number) => {
            const g = groupsDatasetsState.groups.find(g => (g.path === path))
            if (!g) return
            if (!excludeGroups || (path !== group.path)) {
                for (const sg of g.subgroups) {
                    const expanded = groupsDatasetsState.expandedGroupPaths.includes(sg.path)
                    ret.push({type: 'group', name: sg.name, path: sg.path, expanded, indent, key: `group:${sg.path}`})
                    if (expanded) processExpandedGroup(sg.path, indent + 1)
                }
            }
            for (const ds of g.datasets) {
                const expanded = groupsDatasetsState.expandedDatasetPaths.includes(ds.path)
                ret.push({type: 'dataset', name: ds.name, path: ds.path, expanded, indent, key: `dataset:${ds.path}`})
                if (expanded) processExpandedDataset(ds.path, indent + 1)
            }
            for (const attrName of Object.keys(g.attrs).sort()) {
                const attrValue = g.attrs[attrName]
                ret.push({type: 'attribute', name: attrName, value: attrValue, indent, key: `attribute:${g.path}:${attrName}`})
            }
        }
        const processExpandedDataset = (path: string, indent: number) => {
            const d = groupsDatasetsState.datasets.find(d => (d.path === path))
            if (!d) return
            ret.push({type: 'dataset-info', path: d.path, dataset: d, indent, key: `dataset-info:${d.path}`, data: groupsDatasetsState.datasetDatas[d.path]})
            for (const attrName of Object.keys(d.attrs).sort()) {
                const attrValue = d.attrs[attrName]
                ret.push({type: 'attribute', name: attrName, value: attrValue, indent, key: `attribute:${d.path}:${attrName}`})
            }
        }
        processExpandedGroup(group.path, 0)
        return ret
    }, [groupsDatasetsState, group, excludeGroups])

    return (
        <div>
            <table>
                <tbody>
                    {
                        tableItems.map((item, i) => (
                            <TableRow key={item.key} tableItem={item} groupsDatasetsDispatch={groupsDatasetsDispatch} />
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}

type TableRowProps = {
    tableItem: TableItem
    groupsDatasetsDispatch: React.Dispatch<GroupsDatasetsAction>
}

// groups are bluish gray
const groupColor = '#57a'
// datasets are greenish gray
const datasetColor = '#5a7'
// attributes are gray
const attributeColor = '#555'

const groupStyle = {color: groupColor}
const datasetStyle = {color: datasetColor}
const attributeStyle = {color: attributeColor}

const expanderStyle = {color: '#222', cursor: 'pointer'}

const TableRow: FunctionComponent<TableRowProps> = ({tableItem, groupsDatasetsDispatch}) => {
    const {type, indent} = tableItem
    const indentStyle = useMemo(() => ({paddingLeft: `${indent * 10}px`}), [indent])
    switch (type) {
        case 'group':
            return (
                <tr>
                    <td style={indentStyle}>
                        <div
                            onClick={() => {
                                groupsDatasetsDispatch({type: tableItem.expanded ? 'collapseGroup' : 'expandGroup', path: tableItem.path})
                            }}
                        >
                            <span style={expanderStyle}>{tableItem.expanded ? '▼' : '►'}</span>&nbsp;
                            <span style={groupStyle}>{tableItem.name}</span>
                        </div>
                    </td>
                </tr>
            )
        case 'dataset':
            return (
                <tr>
                    <td style={indentStyle}>
                        <div
                            onClick={() => {
                                groupsDatasetsDispatch({type: tableItem.expanded ? 'collapseDataset' : 'expandDataset', path: tableItem.path})
                            }}
                        >
                            <span style={expanderStyle}>{tableItem.expanded ? '▼' : '►'}</span>&nbsp;
                            <span style={datasetStyle}>{tableItem.name}</span>
                        </div>
                    </td>
                </tr>
            )
        case 'attribute':
            return (
                <tr>
                    <td style={indentStyle}>
                        <div>
                            <span>&nbsp;</span>&nbsp;
                            <span style={attributeStyle}>{`${tableItem.name}: ${valueToString(tableItem.value)}`}</span>
                        </div>
                    </td>
                </tr>
            )
        case 'dataset-info':
            return (
                <tr>
                    <td style={indentStyle}>
                        <div>
                            <span>&nbsp;</span>&nbsp;
                            <span style={datasetStyle}>{`${tableItem.dataset.dtype} ${valueToString(tableItem.dataset.shape)}`}</span>
                            {
                                tableItem.data && (
                                    <span>&nbsp;{valueToString(tableItem.data)}</span>
                                )
                            }
                        </div>
                    </td>
                </tr>
            )
    }
}

const product = (arr: number[]) => {
    let ret = 1
    for (const val of arr) {
        ret = ret * val
    }
    return ret
}

export default TopLevelGroupContentPanel