import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { useDropzone } from 'react-dropzone';

const VideoConverter = () => {
  const [selectedFiles, setSelectedFiles] = useState([]); // [{ file: File, progress: number }]
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [isConverting, setIsConverting] = useState(false); // Conversion state
  const [isConversionComplete, setIsConversionComplete] = useState(false); // Track if conversion is complete

  const onDrop = useCallback((acceptedFiles) => {
    const filesWithProgress = acceptedFiles.map((file) => ({ file, progress: 0 }));
    setSelectedFiles((prevFiles) => [...prevFiles, ...filesWithProgress]);
    setConvertedFiles([]);
    setStatus(`Uploaded ${acceptedFiles.length} new file(s). Total: ${acceptedFiles.length + selectedFiles.length}`);
  }, [selectedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'video/mp4',
  });

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const convertMp4ToWebM = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const stream = canvas.captureStream();
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const webmFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webm"), { type: "video/webm" });
          resolve(webmFile);
        };

        mediaRecorder.onerror = () => reject(new Error("Failed to record video"));

        mediaRecorder.start();
        video.play();

        const renderFrame = () => {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          if (!video.ended) {
            requestAnimationFrame(renderFrame);
          } else {
            mediaRecorder.stop();
          }
        };
        renderFrame();
      };

      video.onerror = () => reject(new Error("Failed to load video"));
    });
  };

  const convertToWebM = async () => {
    if (!selectedFiles.length) {
      setStatus("Please select or drop videos to convert!");
      return;
    }

    setConvertedFiles([]);
    setStatus("Converting videos...");
    setIsConverting(true); // Show progress bars
    setIsConversionComplete(false); // Reset conversion complete state

    const converted = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const file = selectedFiles[i].file;

        setSelectedFiles((prevFiles) =>
          prevFiles.map((f, index) =>
            index === i ? { ...f, progress: 0 } : f
          )
        );

        for (let progress = 0; progress < 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          setSelectedFiles((prevFiles) =>
            prevFiles.map((f, index) =>
              index === i ? { ...f, progress } : f
            )
          );
        }

        const webmFile = await convertMp4ToWebM(file);

        converted.push(webmFile);

        setSelectedFiles((prevFiles) =>
          prevFiles.map((f, index) =>
            index === i ? { ...f, progress: 100 } : f
          )
        );
      } catch (error) {
        console.error("Error converting file:", error);
      }
    }

    setConvertedFiles(converted);
    setIsConverting(false);
    setIsConversionComplete(true);

    if (converted.length > 1) {
      setStatus("Conversion successful! Download all the files in a ZIP format.");
    } else {
      setStatus("Conversion successful!");
    }
  };

  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("Converted_WebM_Videos");

    convertedFiles.forEach((file) => {
      folder.file(file.name, file);
    });

    setStatus("Creating ZIP...");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = "Converted_Videos.zip";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("ZIP file ready for download!");
  };

  const downloadFile = (file) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="converter">
      <h1>WebM Converter</h1>

      {/* Drag and Drop Area */}
      {!isConverting && !isConversionComplete && (
        <div
          {...getRootProps()}
          style={{
            border: '2px dashed #ccc',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <p>Drag & drop some files here, or click to select files</p>
          )}
        </div>
      )}

      {/* List Uploaded Files */}
      {selectedFiles.length > 0 && (
        <div className="file-list">
          <h3>Uploaded Files:</h3>
          <ul style={{ paddingLeft: '0' }}>
            {selectedFiles.map((fileObj, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ flex: 1 }}>{fileObj.file.name}</span>
                {isConverting && (
                  <div
                    style={{
                      position: 'relative',
                      width: '50%',
                      height: '5px',
                      background: '#e0e0e0',
                      borderRadius: '5px',
                      overflow: 'hidden',
                      margin: '0 10px',
                    }}
                  >
                    <div
                      style={{
                        width: `${fileObj.progress}%`,
                        height: '5px',
                        background: '#4caf50',
                        position: 'absolute',
                      }}
                    />
                  </div>
                )}
                {!isConverting && !isConversionComplete && (
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      marginLeft: '10px',
                      color: 'red',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    ✖
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Convert Button */}
      {!isConversionComplete && (
        <button
          onClick={convertToWebM}
          style={{
            marginTop: '10px',
            background: '#014599',
            border: 'none',
            color: '#fff',
            padding: '15px',
            display: 'block',
            margin: '0 auto',
            width: '200px',
            fontSize: '16px',
            transition: 'background-color 0.3s',
            pointerEvents: isConverting ? 'none' : 'unset',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#0b1b5c')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#014599')}
          className={isConverting ? 'disabled' : ''}
        >
          CONVERT
        </button>
      )}
      <p style={{ fontWeight: 'bold' }}>{status}</p>

      {/* Show "Download All as ZIP" button if there are multiple files */}
      {convertedFiles.length > 1 && (
        <button onClick={downloadAllAsZip}>Download Files (ZIP)</button>
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

export default VideoConverter;
