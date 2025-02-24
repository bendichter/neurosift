import { FunctionComponent } from "react";
import {
  CondensedLayout,
  FullLayout,
  ItemRangeControls,
  LabeledRow,
  TimeRangeControls,
} from "../common/components/TimeseriesControls";

type ControlsProps = {
  startTime: number;
  endTime: number;
  visibleUnitsStart: number;
  numVisibleUnits: number;
  totalNumUnits: number;
  visibleTimeStart?: number;
  visibleDuration?: number;
  blockSizeSec: number;
  onDecreaseUnits: () => void;
  onIncreaseUnits: () => void;
  onShiftUnitsLeft: () => void;
  onShiftUnitsRight: () => void;
  onDecreaseVisibleDuration: () => void;
  onIncreaseVisibleDuration: () => void;
  onShiftTimeLeft: () => void;
  onShiftTimeRight: () => void;
};

export const CondensedControls: FunctionComponent<ControlsProps> = ({
  visibleUnitsStart,
  numVisibleUnits,
  totalNumUnits,
  visibleTimeStart,
  visibleDuration,
  startTime,
  endTime,
  onDecreaseUnits,
  onIncreaseUnits,
  onShiftUnitsLeft,
  onShiftUnitsRight,
  onDecreaseVisibleDuration,
  onIncreaseVisibleDuration,
  onShiftTimeLeft,
  onShiftTimeRight,
}) => {
  return (
    <CondensedLayout>
      <ItemRangeControls
        visibleStartIndex={visibleUnitsStart}
        numVisibleItems={numVisibleUnits}
        totalNumItems={totalNumUnits}
        itemLabel="Units"
        onDecreaseItems={onDecreaseUnits}
        onIncreaseItems={onIncreaseUnits}
        onShiftItemsLeft={onShiftUnitsLeft}
        onShiftItemsRight={onShiftUnitsRight}
      />
      <TimeRangeControls
        visibleTimeStart={visibleTimeStart}
        visibleDuration={visibleDuration}
        timeseriesStartTime={startTime}
        timeseriesDuration={endTime - startTime}
        onDecreaseVisibleDuration={onDecreaseVisibleDuration}
        onIncreaseVisibleDuration={onIncreaseVisibleDuration}
        onShiftTimeLeft={onShiftTimeLeft}
        onShiftTimeRight={onShiftTimeRight}
      />
    </CondensedLayout>
  );
};

export const Controls: FunctionComponent<ControlsProps> = ({
  startTime,
  endTime,
  visibleUnitsStart,
  numVisibleUnits,
  totalNumUnits,
  visibleTimeStart,
  visibleDuration,
  blockSizeSec,
  onDecreaseUnits,
  onIncreaseUnits,
  onShiftUnitsLeft,
  onShiftUnitsRight,
  onDecreaseVisibleDuration,
  onIncreaseVisibleDuration,
  onShiftTimeLeft,
  onShiftTimeRight,
}) => {
  return (
    <FullLayout>
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          background: "#f8f9fa",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #e9ecef",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          fontSize: "0.9rem",
          color: "#495057",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        <span>
          Start: {startTime.toFixed(2)} s, Duration:{" "}
          {(endTime - startTime).toFixed(2)} s • Block Size: {blockSizeSec} seconds
        </span>
      </div>

      <ItemRangeControls
        visibleStartIndex={visibleUnitsStart}
        numVisibleItems={numVisibleUnits}
        totalNumItems={totalNumUnits}
        itemLabel="Units"
        onDecreaseItems={onDecreaseUnits}
        onIncreaseItems={onIncreaseUnits}
        onShiftItemsLeft={onShiftUnitsLeft}
        onShiftItemsRight={onShiftUnitsRight}
      />

      <TimeRangeControls
        visibleTimeStart={visibleTimeStart}
        visibleDuration={visibleDuration}
        timeseriesStartTime={startTime}
        timeseriesDuration={endTime - startTime}
        onDecreaseVisibleDuration={onDecreaseVisibleDuration}
        onIncreaseVisibleDuration={onIncreaseVisibleDuration}
        onShiftTimeLeft={onShiftTimeLeft}
        onShiftTimeRight={onShiftTimeRight}
        label="Time Window"
      />
    </FullLayout>
  );
};
