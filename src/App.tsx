// import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

// Public & User Components
import Main1 from "./Main1";
import Signup from "./user/Signup";
import Login from "./user/Login";
import VendorRegistration from "./vendor/VendorRegistration";

// Citizen Sub-Components
import Citizen from "./citizen/CitizenRegristration";
import Services from "./services/Services";
import Favs from "./favs/Favs";

// Dashboards
import CitizenDash from "./dashboard/CitizenDash";
import VendorDash from "./dashboard/VendorDash";
import AdminDash from "./dashboard/AdminDash";


function App() {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      <Route path="/" element={<Main1 />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/vendorregistration" element={<VendorRegistration />} />
     

      {/* 2. CITIZEN DASHBOARD */}
      <Route path="/citizendash" element={<CitizenDash />}>
        {/* Form ab alag route 'form' par khulega */}
        <Route path="form" element={<Citizen />} />
        <Route path="search" element={<Services />} />
        <Route path="favs" element={<Favs />} />
      </Route>

      {/* 3. VENDOR DASHBOARD */}
      <Route path="/vendordash" element={<VendorDash />}>
        {/* Registration form alag route par */}
        <Route path="vendorregistration" element={<VendorRegistration />} />
      </Route>

      {/* 4. ADMIN DASHBOARD */}
      <Route path="/admindash/*" element={<AdminDash />} />

      {/* 5. CATCH-ALL ROUTE */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;