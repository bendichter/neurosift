import { FunctionComponent } from "react"
import Splitter from "../../../components/Splitter"
import AcquisitionItemTimeseriesView from "../NwbAcquisitionItemView/AcquisitionItemTimeseriesView"
import SpatialSeriesSpatialView from "./SpatialSeriesSpatialView"

type Props = {
    width: number
    height: number
    objectPath: string
    condensed?: boolean
}

const SpatialSeriesWidget: FunctionComponent<Props> = ({width, height, objectPath, condensed}) => {
    const timeseriesContent = (
        <AcquisitionItemTimeseriesView
            width={width}
            height={height}
            objectPath={objectPath}
        />
    )

    if (condensed) return timeseriesContent

    return (
        <Splitter
            width={width}
            height={height}
            direction="vertical"
            initialPosition={height / 2}
        >
            {timeseriesContent}
            <SpatialSeriesSpatialView
                width={width}
                height={height}
                objectPath={objectPath}
            />
        </Splitter>

    )
}

export default SpatialSeriesWidget