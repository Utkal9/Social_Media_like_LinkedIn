import React, { useState } from "react";
import {
    Button,
    TextField,
    Container,
    Paper,
    Box,
    Typography,
    Grid,
} from "@mui/material";
import UserLayout from "@/layout/UserLayout"; // Import layout
import DashboardLayout from "@/layout/DashboardLayout"; // Import layout
// Note: You do not need a Navbar import if it's included in UserLayout

function MeetPage() {
    const [meetingCode, setMeetingCode] = useState("");

    const handleJoinVideoCall = () => {
        if (!meetingCode.trim()) {
            // Using a simple browser alert for this example,
            // but you could replace with a modal or snackbar
            console.error("Please enter a meeting code.");
            return;
        }
        // This is correct: open the URL of your video call app
        window.open(`http://localhost:3001/${meetingCode.trim()}`, "_blank");
    };

    const handleStartNewCall = () => {
        const newRoomId = crypto.randomUUID(); // Generates a unique ID
        window.open(`http://localhost:3001/${newRoomId}`, "_blank");
    };

    return (
        <Container
            maxWidth="lg"
            sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                py: { xs: 4, md: 8 },
            }}
        >
            <Grid
                container
                spacing={4}
                alignItems="center"
                justifyContent="center"
            >
                {/* Left Panel */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ pr: { md: 4 } }}>
                        <Typography
                            variant="h3"
                            component="h1"
                            fontWeight="bold"
                            gutterBottom
                        >
                            Video Meetings
                        </Typography>
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            paragraph
                        >
                            Enter a meeting code to join a call or start a new
                            one.
                        </Typography>

                        {/* Join Call Form */}
                        <Paper
                            elevation={3}
                            sx={{
                                p: 3,
                                mt: 3,
                                display: "flex",
                                gap: 2,
                                borderRadius: "12px",
                            }}
                        >
                            <TextField
                                fullWidth
                                onChange={(e) => setMeetingCode(e.target.value)}
                                value={meetingCode}
                                id="outlined-basic"
                                label="Meeting Code"
                                variant="outlined"
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleJoinVideoCall()
                                }
                            />
                            <Button
                                onClick={handleJoinVideoCall}
                                variant="contained"
                                size="large"
                                sx={{ py: "15px", px: 4 }}
                            >
                                Join
                            </Button>
                        </Paper>

                        {/* --- ADDED THIS BUTTON --- */}
                        <Button
                            onClick={handleStartNewCall}
                            variant="outlined"
                            size="large"
                            fullWidth
                            sx={{ mt: 2, py: "15px" }}
                        >
                            Start a New Call
                        </Button>
                    </Box>
                </Grid>

                {/* Right Panel (Image) */}
                <Grid item xs={12} md={6}>
                    <img
                        src="/images/homemain_connection.jpg" // Use an image from your project
                        alt="Video Call"
                        style={{
                            width: "100%",
                            maxWidth: "500px",
                            height: "auto",
                            borderRadius: "16px",
                        }}
                    />
                </Grid>
            </Grid>
        </Container>
    );
}

// Add the layout structure
MeetPage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};

export default MeetPage;
