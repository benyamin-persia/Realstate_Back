import { createContext, useEffect, useState } from "react";
import "./uploadWidget.scss";

// Create a context to manage the script loading state
const CloudinaryScriptContext = createContext();

export default function UploadWidget({ uwConfig, setPublicId, setState, existingImages = [] }) {
  const [loaded, setLoaded] = useState(false);
  const [uploadedImages, setUploadedImages] = useState(existingImages);

  // Update uploadedImages when existingImages changes
  useEffect(() => {
    setUploadedImages(existingImages);
  }, [existingImages]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;

    script.onload = () => {
      setLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeCloudinaryWidget = (e) => {
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (loaded) {
      var myWidget = window.cloudinary.createUploadWidget(
        {
          ...uwConfig,
          multiple: true,
          showUploadMoreButton: true,
          showRemoveButton: true,
          showCompletedButton: true,
          showSkipCropButton: true,
          showPoweredBy: false,
          styles: {
            palette: {
              window: "#FFFFFF",
              windowBorder: "#90A0B3",
              tabIcon: "#0078FF",
              menuIcons: "#5A616A",
              textDark: "#000000",
              textLight: "#FFFFFF",
              link: "#0078FF",
              action: "#FF620C",
              inactiveTabIcon: "#0E2F5A",
              error: "#F44235",
              inProgress: "#0078FF",
              complete: "#20B832",
              sourceBg: "#E4EBF1"
            }
          }
        },
        (error, result) => {
          if (!error && result && result.event === "success") {
            console.log("Done! Here is the image info: ", result.info);
            const newImage = result.info.secure_url;
            setUploadedImages(prev => [...prev, newImage]);
            setState(prev => [...prev, newImage]);
          }
        }
      );

      myWidget.open();
    }
  };

  const handleRemoveImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setState(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="uploadWidget">
      <button onClick={initializeCloudinaryWidget} type="button" className="cloudinary-button">
        {uploadedImages.length > 0 ? 'Add More Images' : 'Upload Images'}
      </button>
      
      {uploadedImages.length > 0 && (
        <div className="images">
          {uploadedImages.map((image, index) => (
            <div key={index} className="image">
              <img src={image} alt={`Uploaded ${index + 1}`} />
              <button
                onClick={() => handleRemoveImage(index)}
                type="button"
                className="removeButton"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { CloudinaryScriptContext };
