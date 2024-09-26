import { RemoteH5Dataset, RemoteH5FileX } from "@remote-h5-file/index";
import { FunctionComponent, useEffect, useMemo, useState } from "react";
import { leftPanelLabelMap, valueToString2 } from "./NwbMainLeftPanel";
import { useNwbFileSpecifications } from "../SpecificationsView/SetupNwbFileSpecificationsProvider";

type InfoViewProps = {
  width: number;
  height: number;
  nwbFile: RemoteH5FileX;
};

type GeneralItem = {
  name: string;
  path: string;
  renderer?: (val: any) => string;
  dataset?: RemoteH5Dataset;
  datasetData: any;
};

type NeurodataItem = {
  path: string;
  neurodataType: string;
};

type DatasetItem = {
  path: string;
  shape: number[];
  dtype: string;
};

type SpecificationItem = {
  neurodataType: string;
  doc: string;
};

const InfoView: FunctionComponent<InfoViewProps> = ({
  width,
  height,
  nwbFile,
}) => {
  const [generalItems, setGeneralItems] = useState<GeneralItem[]>([]);
  const [neurodataItems, setNeurodataItems] = useState<NeurodataItem[]>([]);
  const [datasetItems, setDatasetItems] = useState<DatasetItem[]>([]);
  const [specificationItems, setSpecificationItems] = useState<
    SpecificationItem[]
  >([]);
  const specifications = useNwbFileSpecifications();
  useEffect(() => {
    let canceled = false;
    setGeneralItems([]);
    (async () => {
      const rootGroup = await nwbFile.getGroup("/");
      if (!rootGroup) {
        console.warn("Root group not found");
        return;
      }
      const x: GeneralItem[] = [];
      for (const ds of rootGroup.datasets) {
        const mm = leftPanelLabelMap.find((x) => x.name === ds.name);
        const newName = mm?.newName || ds.name;
        x.push({
          name: newName || ds.name,
          path: ds.path,
          renderer: mm?.renderer,
          dataset: await nwbFile.getDataset(ds.path),
          datasetData: await nwbFile.getDatasetData(ds.path, {}),
        });
        if (canceled) return;
        setGeneralItems([...x]);
      }
      const generalGroup = await nwbFile.getGroup("/general");
      if (generalGroup) {
        for (const ds of generalGroup.datasets) {
          const mm = leftPanelLabelMap.find((x) => x.name === ds.name);
          const newName = mm?.newName || ds.name;
          x.push({
            name: newName || ds.name,
            path: ds.path,
            renderer: mm?.renderer,
            dataset: await nwbFile.getDataset(ds.path),
            datasetData: await nwbFile.getDatasetData(ds.path, {}),
          });
        }
        if (canceled) return;
        setGeneralItems([...x]);
      }
      if (canceled) return;
      setGeneralItems([...x]);
    })();
    return () => {
      canceled = true;
    };
  }, [nwbFile]);

  useEffect(() => {
    let canceled = false;
    setNeurodataItems([]);
    setDatasetItems([]);
    const x: NeurodataItem[] = [];
    const y: DatasetItem[] = [];
    const processGroup = async (groupPath: string) => {
      const group = await nwbFile.getGroup(groupPath);
      if (canceled) return;
      if (!group) {
        return;
      }
      if (group.attrs.neurodata_type) {
        x.push({
          path: groupPath,
          neurodataType: group.attrs.neurodata_type,
        });
        setNeurodataItems([...x]);
      }
      for (const subGroup of group.subgroups) {
        await processGroup(subGroup.path);
        if (canceled) return;
      }
      for (const ds of group.datasets) {
        await processDataset(ds.path);
        if (canceled) return;
      }
    };
    const processDataset = async (datasetPath: string) => {
      const ds = await nwbFile.getDataset(datasetPath);
      if (!ds) return;
      if (canceled) return;
      y.push({
        path: datasetPath,
        shape: ds.shape,
        dtype: ds.dtype,
      });
      setDatasetItems([...y]);
    };
    processGroup("/");
    return () => {
      canceled = true;
    };
  }, [nwbFile]);

  useEffect(() => {
    if (!specifications) return;
    const ntUsed = new Set<string>();
    for (const item of neurodataItems) {
      ntUsed.add(item.neurodataType);
    }
    const x: SpecificationItem[] = [];
    for (const sgrp of specifications.allGroups) {
      if (!ntUsed.has(sgrp.neurodata_type_def)) continue;
      x.push({
        neurodataType: sgrp.neurodata_type_def,
        doc: sgrp.doc,
      });
    }
    setSpecificationItems([...x]);
  }, [neurodataItems, specifications]);

  const text = useMemo(() => {
    const txtLines1 = generalItems.map((item) => {
      const renderer = item.renderer || ((val: any) => valueToString2(val));
      return `${item.name}: ${renderer(item.datasetData)}`;
    });
    const txtLines2 = neurodataItems.map((item) => {
      return `${item.path}: ${item.neurodataType}`;
    });
    const txtLines3 = datasetItems.map((item) => {
      return `${item.path}: ${item.shape.join("x")} ${item.dtype}`;
    });
    const txtLinesSpec: string[] = [];
    if (specificationItems.length > 0) {
      txtLinesSpec.push(
        "The following are descriptions of the various neurodata types:",
      );
      for (const item of specificationItems) {
        txtLinesSpec.push(`${item.neurodataType}: ${item.doc}`);
      }
    }
    const preamble = `The following is an auto-generated summary of the contents of an NWB file. Please tell me about the experiment represented by this NWB file and what data are available.`;
    return [
      preamble,
      ...txtLines1,
      ...txtLines2,
      ...txtLines3,
      ...txtLinesSpec,
    ].join("\n\n");
  }, [generalItems, neurodataItems, specificationItems, datasetItems]);

  const [message, setMessage] = useState("");

  return (
    <div style={{ position: "absolute", width, height, overflowY: "auto" }}>
      <p>
        The following is a summary of the contents of this NWB file suitable for
        entering as a prompt to a chatbot:
      </p>
      <button
        onClick={() => {
          navigator.clipboard.writeText(text);
          setMessage("copied");
        }}
      >
        copy
      </button>
      &nbsp;{message}
      <textarea style={{ width: "100%", height: 500 }} value={text} readOnly />
    </div>
  );
};

export default InfoView;
