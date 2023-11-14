// 拖动进度条，调整水印图片位置
import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const WatermarkApp = () => {
  const [images, setImages] = useState([]);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [watermarkPositionX, setWatermarkPositionX] = useState(0.5);
  const [watermarkPositionY, setWatermarkPositionY] = useState(0.5);
  const [scale, setScale] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (images.length > 0 && watermarkImage) {
      updatePreview(images[0]);
    }
  }, [images, watermarkImage, watermarkPositionX, watermarkPositionY, scale]);

  const updatePreview = (imageUrl) => {
    const watermarkImg = new Image();
    watermarkImg.src = watermarkImage;
    watermarkImg.onload = () => {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        ctx.drawImage(
          watermarkImg,
          canvas.width * watermarkPositionX - (watermarkImg.width * scale) / 2,
          canvas.height * watermarkPositionY - (watermarkImg.height * scale) / 2,
          watermarkImg.width * scale,
          watermarkImg.height * scale
        );
        setPreviewUrl(canvas.toDataURL());
      };
    };
  };

  const handleImageUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    const imagePromises = files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(setImages);
  }, []);

  const handleWatermarkImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = e => setWatermarkImage(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleDownload = useCallback(() => {
    const zip = new JSZip();
    const watermarkImg = new Image();
    watermarkImg.src = watermarkImage;

    watermarkImg.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const imagePromises = images.map((imageUrl, index) => {
        return new Promise(resolve => {
          const img = new Image();
          img.src = imageUrl;
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            ctx.drawImage(
              watermarkImg,
              canvas.width * watermarkPositionX - (watermarkImg.width * scale) / 2,
              canvas.height * watermarkPositionY - (watermarkImg.height * scale) / 2,
              watermarkImg.width * scale,
              watermarkImg.height * scale
            );

            canvas.toBlob(blob => {
              zip.file(`watermarked_image_${index + 1}.png`, blob);
              resolve();
            });
          };
        });
      });

      Promise.all(imagePromises).then(() => {
        zip.generateAsync({ type: 'blob' }).then(content => {
          saveAs(content, 'watermarked_images.zip');
        });
      });
    };
  }, [images, watermarkImage, watermarkPositionX, watermarkPositionY, scale]);

  return (
    <div>
      <h2>Watermark App</h2>
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
              onChange={e => setWatermarkPositionX(parseFloat(e.target.value))}
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
              onChange={e => setWatermarkPositionY(parseFloat(e.target.value))}
            />
          </label>
          <h3>Watermark Size</h3>
          <label>
            Scale: {scale}
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
      <h3>Preview</h3>
      {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '400px' }} />}
      <h3>Download Watermarked Images</h3>
      {images.length > 0 && <button onClick={handleDownload}>Download</button>}
    </div>
  );
};

const MarkTool = () => {
  return <WatermarkApp />;
};

export default MarkTool;
