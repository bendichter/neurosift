/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useEffect, useMemo } from "react";
import Plot from "react-plotly.js";
import { Layout, Shape } from "plotly.js";
import { useTimeRange } from "@shared/context-timeseries-selection-2";

type Props = {
  width: number;
  height: number;
  labels: string[] | undefined;
  startTimes: number[];
  stopTimes: number[];
  additionalData?: Record<string, any[]>; // For additional columns to show in hover
};

const TimeIntervalsPlotly: FunctionComponent<Props> = ({
  width,
  height,
  labels,
  startTimes,
  stopTimes,
  additionalData,
}) => {
  // Get distinct labels and assign them to rows
  const distinctLabels = useMemo(() => {
    if (!labels) return [];
    return Array.from(new Set(labels)).sort();
  }, [labels]);

  // Create a simple scatter plot with invisible points for hover
  const scatterData = useMemo(() => {
    if (!labels || distinctLabels.length === 0) {
      // Single row case
      const hoverTexts = startTimes.map((start, i) => {
        return `Start: ${start.toFixed(3)}<br>Stop: ${stopTimes[i].toFixed(3)}<br>Duration: ${(stopTimes[i] - start).toFixed(3)}`;
      });

      return [{
        x: startTimes.map((_, i) => (startTimes[i] + stopTimes[i]) / 2), // Center of interval
        y: Array(startTimes.length).fill(0.3), // Position in the middle of the rectangle
        mode: 'markers',
        marker: { opacity: 0 }, // Invisible markers
        text: hoverTexts,
        hoverinfo: 'text',
        showlegend: false
      }];
    }

    // Create a trace for each distinct label
    return distinctLabels.map((label, rowIndex) => {
      // Find all intervals with this label
      const indices = [];
      for (let i = 0; i < labels.length; i++) {
        if (labels[i] === label) {
          indices.push(i);
        }
      }
      
      // Create hover text with all available data
      const hoverTexts = indices.map(i => {
        let text = `Label: ${labels[i]}<br>Start: ${startTimes[i].toFixed(3)}<br>Stop: ${stopTimes[i].toFixed(3)}<br>Duration: ${(stopTimes[i] - startTimes[i]).toFixed(3)}`;
        
        // Add any additional data columns
        if (additionalData) {
          Object.entries(additionalData).forEach(([key, values]) => {
            if (values[i] !== undefined) {
              text += `<br>${key}: ${values[i]}`;
            }
          });
        }
        
        return text;
      });

      // Calculate the y-position for hover points based on the rectangle position
      const rectHeight = 0.4 / distinctLabels.length;
      const yPos = 0.1 + (rowIndex * rectHeight) + (rectHeight / 2); // Middle of the rectangle
      
      return {
        x: indices.map(i => (startTimes[i] + stopTimes[i]) / 2), // Center of interval
        y: Array(indices.length).fill(yPos),
        mode: 'markers',
        marker: { opacity: 0 }, // Invisible markers
        text: hoverTexts,
        hoverinfo: 'text',
        name: label
      };
    });
  }, [labels, startTimes, stopTimes, distinctLabels, additionalData]);

  // Create shapes for the intervals
  const shapes = useMemo(() => {
    const result: Partial<Shape>[] = [];
    
    if (!labels || distinctLabels.length === 0) {
      // Single row case
      for (let i = 0; i < startTimes.length; i++) {
        result.push({
          type: 'rect',
          x0: startTimes[i],
          x1: stopTimes[i],
          y0: 0.0, // Start at y=0
          y1: 0.4, // Height of rectangle
          fillcolor: 'rgba(100, 100, 100, 0.7)',
          line: {
            width: 1,
            color: 'rgba(70, 70, 70, 0.9)'
          },
          layer: 'below' as const
        });
      }
    } else {
      // Multiple labels case - stack them vertically just above the x-axis
      const rectHeight = 0.4 / distinctLabels.length; // Divide vertical space
      
      for (let i = 0; i < startTimes.length; i++) {
        if (!labels[i]) continue;
        
        const rowIndex = distinctLabels.indexOf(labels[i]);
        if (rowIndex === -1) continue;
        
        // Calculate vertical position based on label
        const y0 = 0.0 + (rowIndex * rectHeight);
        const y1 = y0 + rectHeight;
        
        result.push({
          type: 'rect',
          x0: startTimes[i],
          x1: stopTimes[i],
          y0: y0,
          y1: y1,
          fillcolor: lightColors[rowIndex % lightColors.length],
          line: {
            width: 1,
            color: darkenColor(lightColors[rowIndex % lightColors.length])
          },
          layer: 'below' as const,
          opacity: 0.7
        });
      }
    }
    
    return result;
  }, [labels, startTimes, stopTimes, distinctLabels]);

  // Get the visible time range from the context
  const { visibleStartTimeSec, visibleEndTimeSec } = useTimeRange();

  // Layout configuration
  const layout: Partial<Layout> = useMemo(() => ({
    width,
    height,
    margin: {
      l: 30,  // Further reduced from 50
      r: 10,  // Further reduced from 20
      t: 10,  // Kept the same
      b: 50,  // Kept the same for x-axis label
    },
    xaxis: {
      title: {
        text: "Time (s)",
        font: {
          size: 14,
          color: '#000'
        },
        standoff: 15  // Add some space between the axis and the title
      },
      showgrid: true,
      // Set the range to match the visible time range from the context
      range: visibleStartTimeSec !== undefined && visibleEndTimeSec !== undefined 
        ? [visibleStartTimeSec, visibleEndTimeSec] 
        : undefined,
      zeroline: false, // Remove the zero line
      showline: true, // Show the axis line
      linecolor: '#000', // Black line color
      linewidth: 2, // Make the axis line thicker
      mirror: false, // Don't mirror the axis line to the top
    },
    yaxis: {
      showgrid: false,
      tickmode: "array",
      tickvals: distinctLabels.map((_, i) => i),
      ticktext: distinctLabels,
      // Position all rectangles just above the x-axis
      range: [0, distinctLabels.length > 0 ? 0.9 : 0.4],
      zeroline: false, // Remove the zero line
      showticklabels: false, // Hide y-axis tick labels
      showline: false, // Hide the y-axis line
    },
    hovermode: "closest",
    showlegend: true,
    legend: {
      orientation: "h",
      y: -0.15,
      xanchor: 'center',
      x: 0.5,
      font: { size: 10 },
      tracegroupgap: 5
    },
    shapes: shapes
  }), [width, height, distinctLabels, shapes, visibleStartTimeSec, visibleEndTimeSec]);

  return (
    <Plot
      data={scatterData}
      layout={layout}
      config={{
        displayModeBar: true,
        displaylogo: false,
        responsive: true,
        modeBarButtonsToRemove: [
          'lasso2d', 
          'select2d',
          'toggleSpikelines',
        ],
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

// Helper function to darken a color for the border
const darkenColor = (color: string): string => {
  // Extract rgba values
  const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!match) return color;
  
  const r = Math.max(0, parseInt(match[1]) - 30);
  const g = Math.max(0, parseInt(match[2]) - 30);
  const b = Math.max(0, parseInt(match[3]) - 30);
  const a = parseFloat(match[4]);
  
  return `rgba(${r}, ${g}, ${b}, ${a + 0.1})`;
};

const lightColors: string[] = [
  "rgba(170, 255, 170, 0.8)",
  "rgba(255, 170, 255, 0.8)",
  "rgba(0, 170, 255, 0.8)",
  "rgba(255, 170, 0, 0.8)",
  "rgba(255, 255, 170, 0.8)",
  "rgba(170, 255, 255, 0.8)",
  "rgba(255, 0, 255, 0.8)",
  "rgba(255, 255, 0, 0.8)",
  "rgba(0, 255, 255, 0.8)",
  "rgba(255, 170, 170, 0.8)",
  "rgba(170, 170, 255, 0.8)",
];

export default TimeIntervalsPlotly;
