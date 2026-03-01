"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import {
  User as UserIcon,
  Edit,
  Trash2,
  Plus,
  MapPin,
  Banknote,
  Phone,
  Mail,
  CheckCircle,
  Shield,
  Wallet,
} from "lucide-react";
import {
  accountApi,
  metaApi,
  type User,
  type Address,
  type BankAccount,
  type Province,
  type City,
} from "@/lib/api";
import type { WidgetConfig } from "@/themes/types";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Profile({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { setData } = usePageRuntime();

  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Address dialog states
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    recipient_fullname: "",
    phone_number: "",
    address_line1: "",
    postcode: "",
    province: "",
    city: "",
  });

  // Bank account dialog states
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    iban: "",
    card_number: "",
  });

  // Meta data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userData, addressesData, bankAccountsData, provincesData] = await Promise.all([
        accountApi.getInfo(),
        accountApi.getAddresses(),
        accountApi.getBankAccounts(),
        metaApi.listProvinces(),
      ]);

      setUser(userData);
      setAddresses(addressesData);
      setBankAccounts(bankAccountsData);
      setProvinces(provincesData);

      // Set data for template system
      setData("user.profile", userData);
      setData("user.addresses", addressesData);
      setData("user.bankAccounts", bankAccountsData);
    } catch (err: any) {
      console.error("Profile load error:", err);
      setError(tFrontendAuto("fe.28f81cb68090"));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProvinceChange = async (provinceId: string) => {
    setSelectedProvince(provinceId);
    setAddressForm({ ...addressForm, province: provinceId, city: "" });
    try {
      const citiesData = await metaApi.listCities(provinceId);
      setCities(citiesData);
    } catch (err) {
      console.error("Error loading cities:", err);
    }
  };

  const handleAddressDialogOpen = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        recipient_fullname: address.recipient_fullname,
        phone_number: address.phone_number,
        address_line1: address.address_line1,
        postcode: address.postcode || "",
        province: address.province.id,
        city: address.city.id,
      });
      handleProvinceChange(address.province.id);
    } else {
      setEditingAddress(null);
      setAddressForm({
        recipient_fullname: "",
        phone_number: "",
        address_line1: "",
        postcode: "",
        province: "",
        city: "",
      });
    }
    setAddressDialogOpen(true);
  };

  const handleAddressDialogClose = () => {
    setAddressDialogOpen(false);
    setEditingAddress(null);
    setAddressForm({
      recipient_fullname: "",
      phone_number: "",
      address_line1: "",
      postcode: "",
      province: "",
      city: "",
    });
    setCities([]);
    setSelectedProvince("");
  };

  const handleAddressSave = async () => {
    try {
      if (editingAddress) {
        await accountApi.updateAddress(editingAddress.id, addressForm);
      } else {
        await accountApi.createAddress(addressForm);
      }
      await loadData();
      handleAddressDialogClose();
    } catch (err: any) {
      console.error("Address save error:", err);
      setError(tFrontendAuto("fe.6bcf197023d1"));
    }
  };

  const handleAddressDelete = async (addressId: string) => {
    if (!confirm(tFrontendAuto("fe.97a560a9fa60"))) return;
    try {
      await accountApi.deleteAddress(addressId);
      await loadData();
    } catch (err: any) {
      console.error("Address delete error:", err);
      setError(tFrontendAuto("fe.034a1dce939a"));
    }
  };

  const handleBankDialogOpen = () => {
    setBankForm({ iban: "", card_number: "" });
    setBankDialogOpen(true);
  };

  const handleBankDialogClose = () => {
    setBankDialogOpen(false);
    setBankForm({ iban: "", card_number: "" });
  };

  const handleBankSave = async () => {
    try {
      await accountApi.createBankAccount(bankForm);
      await loadData();
      handleBankDialogClose();
    } catch (err: any) {
      console.error("Bank account save error:", err);
      setError(tFrontendAuto("fe.679b8c646f38"));
    }
  };

  const handleBankDelete = async (accountId: string) => {
    if (!confirm(tFrontendAuto("fe.ba0b473f027e"))) return;
    try {
      await accountApi.deleteBankAccount(accountId);
      await loadData();
    } catch (err: any) {
      console.error("Bank account delete error:", err);
      setError(tFrontendAuto("fe.e453c025a6ad"));
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", py: 8 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            لطفا برای مشاهده پروفایل وارد شوید
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            ورود به حساب کاربری
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, px: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error ?? "خطا در بارگذاری پروفایل."}
        </Alert>
        <Button variant="outlined" onClick={loadData} sx={{ textTransform: "none" }}>
          تلاش مجدد
        </Button>
      </Container>
    );
  }

  const userLevelLabels = {
    0: "مشتری",
    1: "مدیر",
    2: "صاحب",
  };

  const bankStatusLabels = {
    pending: "در انتظار تایید",
    approved: "تایید شده",
    rejected: "رد شده",
  };

  const bankStatusColors = {
    pending: "warning",
    approved: "success",
    rejected: "error",
  } as const;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
          <Avatar
            sx={{ width: 80, height: 80, bgcolor: "primary.main" }}
            src={user.store_user?.display_name ? undefined : undefined} // Could add avatar URL later
          >
            <UserIcon size={40} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
              {user.store_user?.display_name || "کاربر"}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Box component="span" sx={{ color: "text.secondary", display: "inline-flex" }}><Phone size={18} /></Box>
              <Typography variant="body1">{user.mobile}</Typography>
              {user.mobile_verified && <Box component="span" sx={{ color: "success.main", display: "inline-flex" }}><CheckCircle size={18} /></Box>}
            </Stack>
            {user.store_user?.email && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                <Box component="span" sx={{ color: "text.secondary", display: "inline-flex" }}><Mail size={18} /></Box>
                <Typography variant="body2" color="text.secondary">
                  {user.store_user.email}
                </Typography>
                {user.store_user.email_is_verified && <Box component="span" sx={{ color: "success.main", display: "inline-flex" }}><CheckCircle size={16} /></Box>}
              </Stack>
            )}
          </Box>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={userLevelLabels[user.store_user?.level as keyof typeof userLevelLabels] || "مشتری"}
            color="primary"
            variant="outlined"
          />
          {user.is_verified && <Chip label={tFrontendAuto("fe.e87efda1e0fc")} color="success" icon={<Shield size={16} />} />}
          {user.store_user?.is_vendor && <Chip label={tFrontendAuto("fe.c440b2fec1c7")} color="info" />}
          {user.store_user?.is_admin && <Chip label={tFrontendAuto("fe.3ee0cb450020")} color="warning" />}
        </Stack>

        {user.wallet && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box component="span" sx={{ color: "success.main", display: "inline-flex" }}><Wallet size={18} /></Box>
              <Typography variant="body2" color="text.secondary">
                موجودی کیف پول: {user.wallet.available_balance ?? user.wallet.withdrawable_balance} تومان
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ px: 2 }}>
            <Tab label={tFrontendAuto("fe.93ce87ecebd5")} sx={{ textTransform: "none" }} />
            <Tab label={tFrontendAuto("fe.e642e9116918")} sx={{ textTransform: "none" }} />
            <Tab label={tFrontendAuto("fe.81a38a291d01")} sx={{ textTransform: "none" }} />
          </Tabs>
        </Box>

        {/* Personal Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField
                fullWidth
                label={tFrontendAuto("fe.9da04b0b71f9")}
                value={user.mobile}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={tFrontendAuto("fe.a926d003f2b9")}
                value={user.national_id || ""}
                disabled
                sx={{ mb: 2 }}
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField
                fullWidth
                label={tFrontendAuto("fe.42804b9e344e")}
                value={user.store_user?.display_name || ""}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={tFrontendAuto("fe.48ebc456a416")}
                value={user.store_user?.email || ""}
                disabled
                sx={{ mb: 2 }}
              />
            </Box>
          </Stack>
        </TabPanel>

        {/* Addresses Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={() => handleAddressDialogOpen()}
              sx={{ textTransform: "none" }}
            >
              افزودن آدرس جدید
            </Button>
          </Box>

          <List>
            {addresses.map((address) => (
              <ListItem key={address.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2, mb: 2 }}>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <MapPin size={18} />
                      <Typography fontWeight="medium">{address.recipient_fullname}</Typography>
                      {address.frequently_used && <Chip label={tFrontendAuto("fe.0e54c662cf12")} size="small" color="primary" />}
                    </Stack>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">{address.address_line1}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {address.city.name}، {address.province.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        تلفن: {address.phone_number} {address.postcode && `| کد پستی: ${address.postcode}`}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => handleAddressDialogOpen(address)}>
                    <Edit size={20} />
                  </IconButton>
                  <IconButton onClick={() => handleAddressDelete(address.id)}>
                    <Trash2 size={20} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {addresses.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              هیچ آدرسی ثبت نشده است.
            </Typography>
          )}
        </TabPanel>

        {/* Bank Accounts Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={handleBankDialogOpen}
              sx={{ textTransform: "none" }}
            >
              افزودن حساب بانکی
            </Button>
          </Box>

          <List>
            {bankAccounts.map((account) => (
              <ListItem key={account.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2, mb: 2 }}>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Banknote size={18} />
                      <Typography fontWeight="medium">
                        {account.card_number ? `****-****-****-${account.card_number.slice(-4)}` : "حساب شبا"}
                      </Typography>
                      <Chip
                        label={bankStatusLabels[account.status as keyof typeof bankStatusLabels] || account.status}
                        size="small"
                        color={bankStatusColors[account.status as keyof typeof bankStatusColors] || "default"}
                      />
                    </Stack>
                  }
                  secondary={
                    account.iban ? `شبا: ${account.iban}` : account.card_number ? `کارت: ${account.card_number}` : ""
                  }
                />
                <ListItemSecondaryAction>
                  {account.status === "pending" && (
                    <IconButton onClick={() => handleBankDelete(account.id)}>
                      <Trash2 size={20} />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {bankAccounts.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              هیچ حساب بانکی ثبت نشده است.
            </Typography>
          )}
        </TabPanel>
      </Card>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onClose={handleAddressDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAddress ? "ویرایش آدرس" : "افزودن آدرس جدید"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={tFrontendAuto("fe.662e7f9c0d16")}
            value={addressForm.recipient_fullname}
            onChange={(e) => setAddressForm({ ...addressForm, recipient_fullname: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label={tFrontendAuto("fe.49e571d9fbc0")}
            value={addressForm.phone_number}
            onChange={(e) => setAddressForm({ ...addressForm, phone_number: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={tFrontendAuto("fe.f1402dc45f3f")}
            select
            value={addressForm.province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            sx={{ mb: 2 }}
          >
            {provinces.map((province) => (
              <MenuItem key={province.id} value={province.id}>
                {province.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label={tFrontendAuto("fe.9ddae2219b7e")}
            select
            value={addressForm.city}
            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
            disabled={!selectedProvince}
            sx={{ mb: 2 }}
          >
            {cities.map((city) => (
              <MenuItem key={city.id} value={city.id}>
                {city.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label={tFrontendAuto("fe.889f46873df4")}
            multiline
            rows={3}
            value={addressForm.address_line1}
            onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={tFrontendAuto("fe.de246976c5ed")}
            value={addressForm.postcode}
            onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddressDialogClose} sx={{ textTransform: "none" }}>
            لغو
          </Button>
          <Button
            onClick={handleAddressSave}
            variant="contained"
            disabled={!addressForm.recipient_fullname || !addressForm.phone_number || !addressForm.address_line1}
            sx={{ textTransform: "none" }}
          >
            {editingAddress ? "ویرایش" : "افزودن"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bank Account Dialog */}
      <Dialog open={bankDialogOpen} onClose={handleBankDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{tFrontendAuto("fe.79c8f9474633")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={tFrontendAuto("fe.dab2731d08f4")}
            value={bankForm.iban}
            onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value.replace(/[^0-9]/g, "") })}
            placeholder="IR123456789012345678901234"
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label={tFrontendAuto("fe.e928b5f426ac")}
            value={bankForm.card_number}
            onChange={(e) => setBankForm({ ...bankForm, card_number: e.target.value.replace(/[^0-9]/g, "") })}
            placeholder="1234567890123456"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            حداقل یکی از شماره شبا یا شماره کارت باید وارد شود.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBankDialogClose} sx={{ textTransform: "none" }}>
            لغو
          </Button>
          <Button
            onClick={handleBankSave}
            variant="contained"
            disabled={!bankForm.iban && !bankForm.card_number}
            sx={{ textTransform: "none" }}
          >
            افزودن
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}