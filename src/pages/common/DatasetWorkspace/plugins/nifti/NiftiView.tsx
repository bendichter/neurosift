import { FunctionComponent, useState } from "react";
import { Box, Button, Alert } from "@mui/material";
import { DatasetPluginProps } from "../pluginInterface";
import NiftiViewer from "./components/NiftiViewer";

const NiftiView: FunctionComponent<DatasetPluginProps> = ({
  file,
  width,
  height,
}) => {
  const [userConfirmedLoad, setUserConfirmedLoad] = useState(false);
  const fileUrl = file.urls[0];
  const isLargeFile = file.size > 100 * 1024 * 1024; // 100 MB

  const handleConfirm = () => {
    setUserConfirmedLoad(true);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "auto" }}>
      {!userConfirmedLoad ? (
        <Alert
          severity={isLargeFile ? "warning" : "info"}
          sx={{
            bgcolor: isLargeFile ? undefined : "transparent",
            color: isLargeFile ? undefined : "inherit",
            p: 4,
            m: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: "1.2rem",
            "& .MuiAlert-message": {
              fontSize: "1.2rem",
              textAlign: "center",
              mb: 2,
            },
            ...(!isLargeFile && {
              "& .MuiAlert-icon": {
                color: "inherit",
              },
            }),
            maxWidth: 500,
          }}
          action={
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleConfirm}
              sx={{ mt: 2 }}
            >
              {isLargeFile ? "Load Anyway" : "Load"}
            </Button>
          }
        >
          This NIFTI file is {(file.size / (1024 * 1024)).toFixed(1)} MB in
          size.
          <br />
          <br />
          {isLargeFile
            ? "Loading large files may impact performance."
            : "Click to proceed with loading the file."}
        </Alert>
      ) : (
        <NiftiViewer
          fileUrl={fileUrl}
          width={(width || 600) - 30}
          height={height}
        />
      )}
    </Box>
  );
};

export default NiftiView;
