import { useState, useEffect } from "react";
import "./newPostPage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from 'dompurify';
import apiRequest from "../../lib/apiRequest";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import { useNavigate, useSearchParams } from "react-router-dom";
import Map from "../../components/map/Map";

function NewPostPage() {
  const [value, setValue] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [isEditMode, setIsEditMode] = useState(false);
  const [coordinates, setCoordinates] = useState({ latitude: 32.4279, longitude: 53.6880 });
  const [address, setAddress] = useState("");
  const [post, setPost] = useState(null);

  const navigate = useNavigate();

  const handleDeleteImage = (indexToDelete) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToDelete));
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setCoordinates(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleAddressChange = async (e) => {
    const newAddress = e.target.value;
    setAddress(newAddress);

    // Only geocode if the address is long enough
    if (newAddress.length > 5) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAddress)}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setCoordinates({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
          });
        }
      } catch (err) {
        console.error("Error geocoding address:", err);
      }
    }
  };

  const handleMapClick = (newCoordinates) => {
    setCoordinates(newCoordinates);
    // Try to reverse geocode to get the address
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newCoordinates.latitude}&lon=${newCoordinates.longitude}`
    )
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          setAddress(data.display_name);
        }
      })
      .catch(err => {
        console.error("Error reverse geocoding:", err);
      });
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (editId) {
        try {
          const res = await apiRequest.get(`/posts/${editId}`);
          const post = res.data;
          setIsEditMode(true);
          setPost(post);
          
          // Pre-fill form data
          const form = document.querySelector('form');
          if (form) {
            form.name.value = post.title;
            form.cleaningPrice.value = post.price;
            form.address.value = post.address;
            setAddress(post.address);
            form.occupation.value = post.city;
            form.spouseName.value = post.bedroom;
            form.kidName.value = post.bathroom;
            form.type.value = post.type;
            form.property.value = post.property;
            form.latitude.value = post.latitude;
            form.longitude.value = post.longitude;
            
            // Set coordinates for map
            setCoordinates({
              latitude: parseFloat(post.latitude) || 32.4279,
              longitude: parseFloat(post.longitude) || 53.6880
            });
            
            // Set description
            setValue(post.postDetail.desc);
            
            // Set images
            setImages(post.images || []);
            
            // Set optional fields
            if (post.postDetail.utilities) form.utilities.value = post.postDetail.utilities;
            if (post.postDetail.pet) form.pet.value = post.postDetail.pet;
            if (post.postDetail.income) form.income.value = post.postDetail.income;
            if (post.postDetail.size) form.size.value = post.postDetail.size;
            if (post.postDetail.school) form.school.value = post.postDetail.school;
            if (post.postDetail.bus) form.bus.value = post.postDetail.bus;
            if (post.postDetail.restaurant) form.restaurant.value = post.postDetail.restaurant;
          }
        } catch (err) {
          console.error("Error fetching post:", err);
          setError("Failed to load post data");
        }
      }
    };

    fetchPost();
  }, [editId]);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);

    // Validate only required fields
    if (!inputs.name || !inputs.address) {
      setError("Please fill in the required fields (Name and Address)");
      return;
    }

    try {
      const postData = {
        postData: {
          title: inputs.name,
          price: inputs.cleaningPrice ? parseInt(inputs.cleaningPrice) : 0,
          address: inputs.address,
          city: inputs.occupation || 'Not specified',
          bedroom: inputs.spouseName || 'Not specified',
          bathroom: inputs.kidName || 'Not specified',
          type: inputs.type || 'buy',
          property: inputs.property || 'apartment',
          latitude: coordinates.latitude.toString(),
          longitude: coordinates.longitude.toString(),
          images: images,
        },
        postDetail: {
          desc: value ? DOMPurify.sanitize(value) : 'No description provided',
          utilities: inputs.utilities || undefined,
          pet: inputs.pet || undefined,
          income: inputs.income || undefined,
          size: inputs.size ? parseInt(inputs.size) : undefined,
          school: inputs.school ? parseInt(inputs.school) : undefined,
          bus: inputs.bus ? parseInt(inputs.bus) : undefined,
          restaurant: inputs.restaurant ? parseInt(inputs.restaurant) : undefined,
        },
      };

      console.log("Submitting post data:", JSON.stringify(postData, null, 2));

      let res;
      if (isEditMode) {
        res = await apiRequest.put(`/posts/${editId}`, postData);
      } else {
        res = await apiRequest.post("/posts", postData);
      }
      
      navigate("/"+res.data.id);
    } catch (err) {
      console.error("Error submitting post:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(err.response?.data?.message || "Failed to save post");
    }
  };

  const uwConfig = {
    multiple: true,
    cloudName: "lamadev",
    uploadPreset: "estate",
    folder: "posts",
  };

  const setPublicId = (publicId) => {
    // Implementation of setPublicId
  };

  return (
    <div className="newPostPage">
      <div className="formContainer">
        <h1>{isEditMode ? "Edit Post" : "Add New Post"}</h1>
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="name">Name <span className="required">*</span></label>
              <input id="name" name="name" type="text" required />
            </div>
            <div className="item">
              <label htmlFor="cleaningPrice">Cleaning Price</label>
              <input id="cleaningPrice" name="cleaningPrice" type="number" min="0" />
            </div>
            <div className="item">
              <label htmlFor="address">Address <span className="required">*</span></label>
              <input 
                id="address" 
                name="address" 
                type="text" 
                required 
                value={address}
                onChange={handleAddressChange}
              />
            </div>
            <div className="item description">
              <label htmlFor="desc">Description</label>
              <ReactQuill 
                theme="snow" 
                onChange={setValue} 
                value={value}
                modules={modules}
                formats={formats}
              />
            </div>
            <div className="item">
              <label htmlFor="occupation">Occupation</label>
              <input id="occupation" name="occupation" type="text" />
            </div>
            <div className="item">
              <label htmlFor="spouseName">Spouse Name</label>
              <input id="spouseName" name="spouseName" type="text" />
            </div>
            <div className="item">
              <label htmlFor="kidName">Kid Name</label>
              <input id="kidName" name="kidName" type="text" />
            </div>
            <div className="item">
              <label htmlFor="latitude">Latitude</label>
              <input 
                id="latitude" 
                name="latitude" 
                type="number" 
                step="any"
                value={coordinates.latitude}
                onChange={handleCoordinateChange}
              />
            </div>
            <div className="item">
              <label htmlFor="longitude">Longitude</label>
              <input 
                id="longitude" 
                name="longitude" 
                type="number" 
                step="any"
                value={coordinates.longitude}
                onChange={handleCoordinateChange}
              />
            </div>
            <div className="item">
              <label htmlFor="type">Type</label>
              <select id="type" name="type">
                <option value="buy">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="property">Property</label>
              <select id="property" name="property">
                <option value="AKHUND">آخوند</option>
                <option value="AFGHANI">افغانی</option>
                <option value="AFGHAN_MAL">افغان مال</option>
                <option value="SEPAHI">سپاهی</option>
                <option value="BASIJI">بسیجی</option>
                <option value="PAN_TURK">پان ترک</option>
                <option value="PAN_KURD">پان کرد</option>
                <option value="PAN_ARAB">پان عرب</option>
                <option value="SARKOOBGAR">سرکوبگر</option>
                <option value="AGHAZADE">آقازاده</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="utilities">Utilities</label>
              <input id="utilities" name="utilities" type="text" />
            </div>
            <div className="item">
              <label htmlFor="pet">Pet</label>
              <input id="pet" name="pet" type="text" />
            </div>
            <div className="item">
              <label htmlFor="income">Income</label>
              <input id="income" name="income" type="text" />
            </div>
            <div className="item">
              <label htmlFor="size">Size</label>
              <input min={0} id="size" name="size" type="number" />
            </div>
            <div className="item">
              <label htmlFor="school">School</label>
              <input min={0} id="school" name="school" type="number" />
            </div>
            <div className="item">
              <label htmlFor="bus">Bus</label>
              <input min={0} id="bus" name="bus" type="number" />
            </div>
            <div className="item">
              <label htmlFor="restaurant">Restaurant</label>
              <input min={0} id="restaurant" name="restaurant" type="number" />
            </div>
            <div className="buttonContainer">
              <button className="sendButton">{isEditMode ? "Update" : "Add"}</button>
              <UploadWidget
                uwConfig={uwConfig}
                setPublicId={setPublicId}
                setState={setImages}
                existingImages={post?.images || []}
              />
            </div>
            {error && <span className="error">{error}</span>}
          </form>
        </div>
      </div>
      <div className="sideContainer">
        <div className="mapContainer">
          <Map 
            items={[{
              ...coordinates,
              id: 'current-location',
              title: address || 'Current Location',
              bedroom: 0,
              price: 0,
              images: []
            }]} 
            onLocationSelect={handleMapClick}
          />
        </div>
      </div>
    </div>
  );
}

export default NewPostPage;
