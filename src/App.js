import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
// 1. 上传图片
// 2. 上传水印图片
// 3. 水印位置调整，预览
// 4. 应用所有图片
// 5.下载

export default App = () => {
  const [images, setImages] = useState([]);
  const [watermarkImage, setWatermarkImage] = useState('');
  const [watermarkPositionX, setWatermarkPositionX] = useState(0.5);
  const [watermarkPositionY, setWatermarkPositionY] = useState(0.5);
  const [loadingBarProgress, setLoadingBarProgress] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(1);
  const [canvasHeight, setCanvasHeight] = useState(1);
  const [waterWidth, setWaterWidth] = useState(1);
  const [waterHeight, setWaterHeight] = useState(1);

  const canvasRef = useRef();

  useEffect(() => {
    if (images.length > 0 && watermarkImage) {
      console.log(333);
      // 上传之后，就开始预览
      const watermarkImg = new Image();
      watermarkImg.src = watermarkImage;

      watermarkImg.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        console.log(images);
        // 原图
        img.src = images[0];
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          setCanvasWidth(img.width);
          setCanvasHeight(img.height);
          ctx.drawImage(img, 0, 0);
          // TODO 加入比例，调整水印大小
          ctx.drawImage(
            watermarkImg,
            canvas.width * watermarkPositionX - watermarkImg.width / 2,
            canvas.height * watermarkPositionY - watermarkImg.height / 2,
          );

          const previewCanvas = canvasRef.current;
          const previewCtx = previewCanvas.getContext('2d');
          previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          previewCtx.drawImage(
            canvas,
            0,
            0,
            previewCanvas.width,
            previewCanvas.height,
          );
        };
      };
    }
  }, [watermarkPositionX, watermarkPositionY, waterWidth, waterHeight]);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);

    const imagePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log(file);
          resolve(event.target.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((imageDataUrls) => {
      setCanvasWidth(imageDataUrls[0].width);
      setCanvasHeight(imageDataUrls[0].height);
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
          ctx.drawImage(
            watermarkImg,
            canvas.width * watermarkPositionX - watermarkImg.width / 2,
            canvas.height * watermarkPositionY - watermarkImg.height / 2,
          );

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
        };
      });
    };
  };

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
              onChange={(event) =>
                setWatermarkPositionX(parseFloat(event.target.value))
              }
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
              onChange={(event) =>
                setWatermarkPositionY(parseFloat(event.target.value))
              }
            />
          </label>
          <h3>Watermark Size</h3>
          <label>
            Width:
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={waterWidth}
              onChange={(event) =>
                setWaterWidth(parseFloat(event.target.value))
              }
            />
          </label>
          <label>
            Height:
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={waterHeight}
              onChange={(event) =>
                setWaterHeight(parseFloat(event.target.value))
              }
            />
          </label>
        </div>
      )}

      <h3>Preview</h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={(400 * canvasHeight) / canvasWidth}
      />

      <h3>Download Watermarked Images</h3>
      <progress value={loadingBarProgress} max="100" />

      {images.length > 0 && <button onClick={handleDownload}>Download</button>}
    </div>
  );
};

