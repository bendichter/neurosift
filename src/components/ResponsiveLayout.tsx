import React, { FunctionComponent, useEffect, useState } from "react";
import HorizontalSplitter from "./HorizontalSplitter";

export interface ResponsiveLayoutProps {
  width: number;
  height: number;
  initialSplitterPosition: number;
  mobileBreakpoint?: number;
  children: [React.ReactNode, React.ReactNode]; // Exactly two children required
}

const ResponsiveLayout: FunctionComponent<ResponsiveLayoutProps> = ({
  width,
  height,
  initialSplitterPosition,
  mobileBreakpoint = 768, // Common mobile breakpoint
  children,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= mobileBreakpoint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this only runs once on mount

  if (isMobile) {
    // Stack the panels vertically on mobile
    const topHeight = Math.max(200, Math.min(500, height * 0.4));
    const bottomHeight = height - topHeight;

    return (
      <div style={{ position: "relative", width, height }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width,
            height: topHeight,
            overflow: "hidden",
          }}
        >
          {React.cloneElement(children[0] as React.ReactElement, {
            width,
            height: topHeight,
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: topHeight,
            width,
            height: bottomHeight,
            overflow: "hidden",
          }}
        >
          {React.cloneElement(children[1] as React.ReactElement, {
            width,
            height: bottomHeight,
          })}
        </div>
      </div>
    );
  }

  // Use horizontal splitter for desktop
  return (
    <HorizontalSplitter
      width={width}
      height={height}
      initialSplitterPosition={initialSplitterPosition}
    >
      {children}
    </HorizontalSplitter>
  );
};

export default ResponsiveLayout;
