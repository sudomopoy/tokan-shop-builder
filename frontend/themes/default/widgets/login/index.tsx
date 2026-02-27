"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";
import { authApi } from "@/lib/api";
import type { WidgetConfig } from "@/themes/types";
import { useAppDispatch } from "@/lib/store/hooks";
import { setJwtAuth, setTokenAuth } from "@/lib/auth/authService";

type LoginMode = "sms" | "password";

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Login({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<LoginMode>("sms");
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // SMS Login states
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<"mobile" | "otp">("mobile");

  // Password Login states
  const [passwordMobile, setPasswordMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setMode(newValue === 0 ? "sms" : "password");
    setError(null);
    setMessage(null);
    setOtpStep("mobile");
    setOtp("");
  };

  const normalizeMobile = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    
    // If already in E.164 format (+98...), return as is
    if (value.startsWith("+98") && digits.startsWith("98")) {
      return value;
    }
    
    // If starts with 0, replace with +98
    if (digits.startsWith("0")) {
      return "+98" + digits.slice(1);
    }
    
    // If starts with 98 (without +), add +
    if (digits.startsWith("98")) {
      return "+" + digits;
    }
    
    // Otherwise, add +98 prefix
    return "+98" + digits;
  };

  const getNextDestination = (): string => {
    const next = searchParams?.get("next");
    if (next && next.startsWith("/")) {
      return next;
    }
    return "/";
  };

  const handleSMSMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const normalizedMobile = normalizeMobile(mobile);
      await authApi.requestOTP({ mobile: normalizedMobile });
      setMessage("کد تایید به شماره شما ارسال شد.");
      setOtpStep("otp");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.mobile?.[0] ||
        "خطا در ارسال کد تایید. لطفا دوباره تلاش کنید.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedMobile = normalizeMobile(mobile);
      const response = await authApi.verifyOTP({
        mobile: normalizedMobile,
        token: otp,
      });

      if (response.token) {
        setTokenAuth(dispatch, {
          token: response.token,
          user: { mobile: normalizedMobile },
        });
      }

      setMessage("ورود موفقیت‌آمیز بود!");
      router.replace(getNextDestination());
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.token?.[0] ||
        "کد تایید اشتباه است. لطفا دوباره تلاش کنید.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const normalizedMobile = normalizeMobile(passwordMobile);
      const response = await authApi.loginWithPassword({
        mobile: normalizedMobile,
        password: password,
      });

      if (response.access) {
        setJwtAuth(dispatch, {
          access: response.access,
          refresh: response.refresh,
          user: { mobile: normalizedMobile },
        });
      }

      setMessage("ورود موفقیت‌آمیز بود!");
      router.replace(getNextDestination());
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.mobile?.[0] ||
        err.response?.data?.password?.[0] ||
        "شماره موبایل یا رمز عبور اشتباه است.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMobile = () => {
    setOtpStep("mobile");
    setOtp("");
    setError(null);
    setMessage(null);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #00A6e5 0%, #7c3aed 100%)",
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: 4,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            p: 4,
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: "bold",
                color: "text.primary",
                mb: 1,
              }}
            >
              ورود به حساب کاربری
            </Typography>
            <Typography variant="body2" color="text.secondary">
              برای ادامه، وارد حساب کاربری خود شوید
            </Typography>
          </Box>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              mb: 3,
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
              },
            }}
          >
            <Tab
              label="ورود با پیامک"
              icon={<Phone size={20} />}
              iconPosition="start"
            />
            <Tab
              label="ورود با رمز عبور"
              icon={<Lock size={20} />}
              iconPosition="start"
            />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {/* SMS Login Tab */}
          <TabPanel value={tabValue} index={0}>
            {otpStep === "mobile" ? (
              <form onSubmit={handleSMSMobileSubmit}>
                <TextField
                  fullWidth
                  label="شماره موبایل"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="09123456789"
                  required
                  disabled={loading}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !mobile}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "ارسال کد تایید"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOTPSubmit}>
                <TextField
                  fullWidth
                  label="کد تایید"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="12345"
                  required
                  disabled={loading}
                  inputProps={{
                    maxLength: 5,
                    style: {
                      textAlign: "center",
                      fontSize: "1.5rem",
                      letterSpacing: "0.5rem",
                    },
                  }}
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || otp.length !== 5}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "تایید و ورود"
                  )}
                </Button>
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  onClick={handleBackToMobile}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "0.9rem",
                  }}
                >
                  تغییر شماره موبایل
                </Button>
              </form>
            )}
          </TabPanel>

          {/* Password Login Tab */}
          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handlePasswordLogin}>
              <TextField
                fullWidth
                label="شماره موبایل"
                value={passwordMobile}
                onChange={(e) => setPasswordMobile(e.target.value)}
                placeholder="09123456789"
                required
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone size={20} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="رمز عبور"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !passwordMobile || !password}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "ورود"
                )}
              </Button>
            </form>
          </TabPanel>
        </Box>
      </Container>
    </Box>
  );
}
