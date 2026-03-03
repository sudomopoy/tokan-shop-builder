"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  IconButton,
  Badge,
  Typography,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";

export default function DigitokanHeader() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 80 } }}>
          {/* Mobile Menu */}
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="منو"
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: "bold",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
              }}
            >
              دیجی‌توکان
            </Typography>
          </Link>

          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {isAuthenticated ? (
              <IconButton
                size="large"
                aria-label="پروفایل"
                color="inherit"
                component={Link}
                href="/profile"
              >
                <PersonIcon />
              </IconButton>
            ) : (
              <IconButton
                size="large"
                aria-label="ورود"
                color="inherit"
                component={Link}
                href="/login"
              >
                <PersonIcon />
              </IconButton>
            )}

            <IconButton
              size="large"
              aria-label="سبد خرید"
              color="inherit"
              component={Link}
              href="/basket"
            >
              <Badge badgeContent={0} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
