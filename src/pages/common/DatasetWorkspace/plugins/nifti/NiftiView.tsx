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
      {isLargeFile && !userConfirmedLoad ? (
        <Alert
          severity="warning"
          action={
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleConfirm}
              sx={{ mt: 2 }}
            >
              Load anyway
            </Button>
          }
          sx={{
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
          }}
        >
          This NIFTI file is {(file.size / (1024 * 1024)).toFixed(1)} MB in
          size.
          <br />
          <br />
          Loading large files may impact performance.
        </Alert>
      ) : (
        <NiftiViewer fileUrl={fileUrl} width={width} height={height} />
      )}
    </Box>
  );
};

export default NiftiView;
