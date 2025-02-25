import ResponsiveLayout from "@components/ResponsiveLayout";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatasetWorkspace from "../common/DatasetWorkspace/DatasetWorkspace";
import { DatasetFile } from "../common/DatasetWorkspace/plugins/pluginInterface";
import {
  AssetsResponseItem,
  DandisetSearchResultItem,
  DandisetVersionInfo,
} from "../DandiPage/dandi-types";
import { addRecentDandiset } from "../util/recentDandisets";
import useTakeInitialQueryParameter from "../util/useTakeInitialQueryValue";
import DandisetOverview from "./DandisetOverview";
import { useDandisetVersionInfo } from "./useDandisetVersionInfo";
import useQueryAssets from "./useQueryAssets";
import useQueryDandiset from "./useQueryDandiset";
import useRegisterAIComponent from "./useRegisterAIComponent";

type DandisetPageProps = {
  width: number;
  height: number;
};

const DandisetPage: FunctionComponent<DandisetPageProps> = ({
  width,
  height,
}) => {
  const navigate = useNavigate();
  const { dandisetId } = useParams();
  const staging = false;
  const dandisetResponse: DandisetSearchResultItem | undefined | null =
    useQueryDandiset(dandisetId, staging);

  // todo: get dandisetVersion from the route
  const dandisetVersion = "";

  const dandisetVersionInfo: DandisetVersionInfo | null =
    useDandisetVersionInfo(
      dandisetId,
      dandisetVersion || "",
      staging,
      dandisetResponse || null,
    );

  // todo: set dandisetVersion to route if not there yet

  const [maxNumPages] = useState(1);
  const [nwbFilesOnly, setNwbFilesOnly] = useState(false);
  const { assetsResponses, incomplete } = useQueryAssets(
    dandisetId,
    maxNumPages,
    dandisetResponse || null,
    dandisetVersionInfo,
    staging,
    nwbFilesOnly,
  );
  const allAssets: AssetsResponseItem[] | null = useMemo(() => {
    if (!assetsResponses) return null;
    const rr: AssetsResponseItem[] = [];
    assetsResponses.forEach((assetsResponse) => {
      rr.push(...assetsResponse.results);
    });
    return rr;
  }, [assetsResponses]);

  useEffect(() => {
    if (dandisetId) {
      addRecentDandiset(dandisetId);
    }
  }, [dandisetId, staging]);

  const topLevelFiles: DatasetFile[] = useMemo(() => {
    if (!allAssets) return [];
    const topLevelFiles: DatasetFile[] = [];
    const directoriesHandled = new Set<string>();
    allAssets.forEach((asset) => {
      const parts = asset.path.split("/");
      if (parts.length === 1) {
        // file
        topLevelFiles.push({
          id: asset.asset_id,
          key: asset.asset_id,
          filename: asset.path,
          filepath: asset.path,
          parentId: "",
          size: asset.size,
          directory: false,
          urls: [
            `https://api.dandiarchive.org/api/assets/${asset.asset_id}/download/`,
          ],
        });
      } else {
        // directory
        const topLevelDir = parts[0];
        if (!directoriesHandled.has(topLevelDir)) {
          directoriesHandled.add(topLevelDir);
          topLevelFiles.push({
            id: topLevelDir,
            key: topLevelDir,
            filename: topLevelDir,
            filepath: topLevelDir,
            parentId: "",
            size: 0,
            directory: true,
            urls: [],
          });
        }
      }
    });
    return topLevelFiles;
  }, [allAssets]);

  const loadFileFromPath = useMemo(
    () =>
      async (
        filePath: string,
        parentId: string,
      ): Promise<DatasetFile | null> => {
        const asset = allAssets?.find((a) => a.path === filePath);
        if (!asset) return null;
        return {
          id: asset.asset_id,
          key: asset.asset_id,
          filename: asset.path,
          filepath: asset.path,
          parentId: parentId,
          size: asset.size,
          directory: false,
          urls: [
            `https://api.dandiarchive.org/api/assets/${asset.asset_id}/download/`,
          ],
        };
      },
    [allAssets],
  );

  const fetchDirectory = useMemo(
    () =>
      async (parent: DatasetFile): Promise<DatasetFile[]> => {
        if (!parent.directory) return [];
        const newFiles: DatasetFile[] = [];
        const handledSubdirectories = new Set<string>();
        allAssets?.forEach((asset) => {
          if (asset.path.startsWith(parent.filepath + "/")) {
            const p = asset.path.slice(parent.filepath.length + 1);
            const parts = p.split("/");
            if (parts.length === 1) {
              // file
              newFiles.push({
                id: asset.asset_id,
                key: asset.asset_id,
                filename: asset.path.split("/").pop() || "",
                filepath: asset.path,
                parentId: parent.id,
                size: asset.size,
                directory: false,
                urls: [
                  `https://api.dandiarchive.org/api/assets/${asset.asset_id}/download/`,
                ],
              });
            } else {
              // directory
              const subDir = parts[0];
              if (!handledSubdirectories.has(subDir)) {
                handledSubdirectories.add(subDir);
                newFiles.push({
                  id: parent.filepath + "/" + subDir,
                  key: parent.filepath + "/" + subDir,
                  filename: subDir,
                  filepath: parent.filepath + "/" + subDir,
                  parentId: parent.id,
                  size: 0,
                  directory: true,
                  urls: [],
                });
              }
            }
          }
        });
        return newFiles;
      },
    [allAssets],
  );

  const specialOpenFileHandler = useCallback(
    (file: DatasetFile) => {
      if (file.filepath.endsWith(".nwb")) {
        navigate(
          `/nwb?url=${file.urls[0]}&dandisetId=${dandisetId}&dandisetVersion=${dandisetVersionInfo?.version}`,
        );
        return true;
      }
      return false;
    },
    [dandisetId, dandisetVersionInfo, navigate],
  );

  const nwbFilesOwnlyControlVisible = useMemo(() => {
    // if nwbFilesOnly is true then we'll show the control
    if (nwbFilesOnly) return true;
    // if we have a partial list then we'll show the control
    if (incomplete) return true;
    // if none of the files are nwb then we do not show the control
    if (allAssets?.every((a) => !a.path.endsWith(".nwb"))) return false;
    // if some of the files are not NWB files then we'll show the control
    if (allAssets?.some((a) => !a.path.endsWith(".nwb"))) return true;
    // otherwise we don't show the control
    return false;
  }, [allAssets, nwbFilesOnly, incomplete]);

  const mainTabAdditionalControls = nwbFilesOwnlyControlVisible ? (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "14px",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={nwbFilesOnly}
        onChange={(e) => setNwbFilesOnly(e.target.checked)}
      />
      Show NWB files only
    </label>
  ) : undefined;

  const initialTabId = useTakeInitialQueryParameter("tab");

  // Register AI component
  useRegisterAIComponent({
    dandisetId,
    dandisetVersionInfo,
    allAssets,
    nwbFilesOnly,
    incomplete,
    nwbFilesOwnlyControlVisible,
  });

  if (!dandisetResponse || !dandisetVersionInfo) {
    return <div>Loading...</div>;
  }

  const initialSplitterPosition = Math.max(500, Math.min(650, (width * 2) / 5));

  return (
    <ResponsiveLayout
      width={width}
      height={height}
      initialSplitterPosition={initialSplitterPosition}
      mobileBreakpoint={768}
    >
      <DandisetOverview
        width={0}
        height={0}
        dandisetVersionInfo={dandisetVersionInfo}
        incomplete={incomplete}
        numFilesLoaded={allAssets ? allAssets.length : 0}
      />
      <DatasetWorkspace
        width={0}
        height={0}
        topLevelFiles={topLevelFiles}
        initialTab={initialTabId}
        loadFileFromPath={loadFileFromPath}
        fetchDirectory={fetchDirectory}
        specialOpenFileHandler={specialOpenFileHandler}
        mainTabAdditionalControls={mainTabAdditionalControls}
      />
    </ResponsiveLayout>
  );
};

export default DandisetPage;
