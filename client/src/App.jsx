import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "@/components/Layout";
import { Landing } from "@/pages/Landing";
import { LandlordDashboard } from "@/pages/LandlordDashboard";
import { AddListing } from "@/pages/AddListing";
import { TenantExplore } from "@/pages/TenantExplore";
import { ListingDetails } from "@/pages/ListingDetails";
import { EscrowActions } from "@/pages/EscrowActions";
import { DisputeCaseUpload } from "@/pages/DisputeCaseUpload";
import { NewDispute } from "@/pages/NewDispute";
import { LandlordDispute } from "@/pages/LandlordDispute";
import { JuryDashboard } from "@/pages/JuryDashboard";
import { JuryCase } from "@/pages/JuryCase";
import Clarity from "@microsoft/clarity";

function App() {
    const projectId = "t015b3u6fs";
    Clarity.init(projectId);
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/landlord" element={<LandlordDashboard />} />
                    <Route path="/landlord/new" element={<AddListing />} />
                    <Route
                        path="/landlord/disputes/:id"
                        element={<LandlordDispute />}
                    />
                    <Route path="/tenant" element={<TenantExplore />} />
                    <Route
                        path="/tenant/listing/:id"
                        element={<ListingDetails />}
                    />
                    <Route path="/tenant/escrow" element={<EscrowActions />} />
                    <Route
                        path="/tenant/escrow/:rentalId"
                        element={<EscrowActions />}
                    />
                    <Route
                        path="/disputes/upload"
                        element={<DisputeCaseUpload />}
                    />
                    <Route path="/disputes/new" element={<NewDispute />} />
                    <Route path="/jury" element={<JuryDashboard />} />
                    <Route path="/jury/case/:id" element={<JuryCase />} />
                </Routes>
            </Layout>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: "#FFFFFF",
                        border: "2px solid #111111",
                        borderRadius: "1.25rem",
                        boxShadow: "4px 4px 0 0 rgba(0,0,0,0.9)",
                        color: "#111111",
                        fontFamily: "Inter, system-ui, sans-serif",
                    },
                }}
            />
        </Router>
    );
}

export default App;
