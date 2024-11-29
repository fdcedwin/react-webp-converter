import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';

const Converter = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [status, setStatus] = useState("");

  // Handle file selection
  const handleFileSelection = (event) => {
    setSelectedFiles([...event.target.files]);
    setConvertedFiles([]);
    setStatus("");
  };

  // Convert images to WebP
  const convertToWebP = async () => {
    if (!selectedFiles.length) {
      setStatus("Please select images to convert!");
      return;
    }

    const options = {
      fileType: "image/webp",
      maxSizeMB: 1,
      useWebWorker: true,
    };

    const converted = [];
    setStatus("Converting images...");
    for (const file of selectedFiles) {
      try {
        const compressedFile = await imageCompression(file, options);

        // Rename the file to have a .webp extension
        const webpFile = new File([compressedFile], file.name.replace(/\.[^/.]+$/, ".webp"), {
          type: "image/webp",
        });

        converted.push(webpFile);
      } catch (error) {
        console.error("Error converting file:", error);
      }
    }

    setConvertedFiles(converted);

    if (converted.length > 1) {
      setStatus("Conversion successful! Download all files as a ZIP.");
    } else {
      setStatus("Conversion successful!");
    }
  };

  // Download all files as a ZIP
  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("Converted_WebP_Images");

    // Add each converted file to the ZIP
    convertedFiles.forEach((file) => {
      folder.file(file.name, file);
    });

    // Generate the ZIP and trigger download
    setStatus("Creating ZIP...");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = "Converted_Images.zip";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("ZIP file ready for download!");
  };

  // Download a single file
  const downloadFile = (file) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="converter">
      <h1>Image to WebP Converter</h1>

      {/* File Input */}
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg"
        onChange={handleFileSelection}
      />
      <button onClick={convertToWebP}>Convert to WebP</button>
      <p>{status}</p>

      {/* Show "Download All as ZIP" button if there are multiple files */}
      {convertedFiles.length > 1 && (
        <button onClick={downloadAllAsZip}>Download All as ZIP</button>
      )}

      {/* Show individual downloads if only one file is converted */}
      {convertedFiles.length === 1 && (
        <div className="converted-files">
          <p>{convertedFiles[0].name}</p>
          <button onClick={() => downloadFile(convertedFiles[0])}>Download</button>
        </div>
      )}
    </div>
  );
};

export default Converter;
