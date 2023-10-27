import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default App = () => {
  const [images, setImages] = useState([]);
  const [watermarkImage, setWatermarkImage] = useState('');
  const [watermarkPositionX, setWatermarkPositionX] = useState(0.5);
  const [watermarkPositionY, setWatermarkPositionY] = useState(0.5);
  const [loadingBarProgress, setLoadingBarProgress] = useState(0);

  const canvasRef = useRef();

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);

    const imagePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((imageDataUrls) => {
      setImages(imageDataUrls);
    });
  };

  const handleWatermarkImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      setWatermarkImage(event.target.result);
    };

    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const zip = new JSZip();

    const watermarkImg = new Image();
    watermarkImg.src = watermarkImage;

    watermarkImg.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      images.forEach((imageUrl, index) => {
        const img = new Image();
        img.src = imageUrl;

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);
          ctx.drawImage(watermarkImg, canvas.width * watermarkPositionX - watermarkImg.width / 2, canvas.height * watermarkPositionY - watermarkImg.height / 2);

          canvas.toBlob((blob) => {
            zip.file(`watermarked_image_${index + 1}.png`, blob);

            const progress = Math.round(((index + 1) / images.length) * 100);
            setLoadingBarProgress(progress);

            if (index === images.length - 1) {
              zip.generateAsync({ type: 'blob' }).then((content) => {
                saveAs(content, 'watermarked_images.zip');
                setLoadingBarProgress(0);
              });
            }
          });

          // 更新预览
          updatePreview(canvas);
        };
      });
    };
  };

  const updatePreview = (canvas) => {
    const previewCanvas = canvasRef.current;
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);

    if (images.length > 0) {
      const firstImage = images[0];
      const img = new Image();
      img.src = firstImage.url;
      img.onload = () => {
        previewCtx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
      };
    }
  };

  const handleWatermark = () => {
    const watermarkImg = new Image();
    watermarkImg.src = watermarkImage;

    watermarkImg.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      images.forEach((imageUrl, index) => {
        const img = new Image();
        img.src = imageUrl;

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);
          ctx.drawImage(watermarkImg, canvas.width * watermarkPositionX - watermarkImg.width / 2, canvas.height * watermarkPositionY - watermarkImg.height / 2);

          const dataUrl = canvas.toDataURL('image/png');
          setImages((prevImages) => {
            const updatedImages = [...prevImages];
            updatedImages[index] = dataUrl;
            return updatedImages;
          });

          // 更新预览
          updatePreview(canvas);
        };
      });
    };
  };

  return (
    <div>
      <h1>Watermark App</h1>

      <h3>Upload Images</h3>
      <input type="file" multiple onChange={handleImageUpload} />

      <h3>Upload Watermark Image</h3>
      <input type="file" onChange={handleWatermarkImageUpload} />

      {watermarkImage && (
        <div>
          <h3>Watermark Position</h3>
          <label>
            X:
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={watermarkPositionX}
              onChange={(event) => setWatermarkPositionX(parseFloat(event.target.value))}
            />
          </label>
          <label>
            Y:
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={watermarkPositionY}
              onChange={(event) => setWatermarkPositionY(parseFloat(event.target.value))}
            />
          </label>

          <button onClick={handleWatermark}>Apply Watermark</button>
        </div>
      )}

      <h3>Preview</h3>
      <canvas ref={canvasRef} width={300} height={300} />

      <h3>Download Watermarked Images</h3>
      <progress value={loadingBarProgress} max="100" />

      {images.length > 0 && (
        <button onClick={handleDownload}>Download</button>
      )}
    </div>
  );
};