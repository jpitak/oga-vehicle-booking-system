import React, { useState, useEffect } from 'react';
import { User, Booking, Vehicle, MaintenanceItem, NotificationItem } from './types';
import { apiService, storage } from './services/apiService';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BookingWizard } from './components/BookingWizard';
import { ApprovalView } from './components/ApprovalView';
import { GPSTrackingView } from './components/GPSTrackingView';
import { ReturnVehicleView } from './components/ReturnVehicleView';
import { VehicleFleetView } from './components/VehicleFleetView';
import { MaintenanceView } from './components/MaintenanceView';
import { ReportsView } from './components/ReportsView';
import { MasterManagementView } from './components/MasterManagementView';
import { CalendarBookingView } from './components/CalendarBookingView';
import { GoogleDriveView } from './components/GoogleDriveView';
import { ThemeModal } from './components/ThemeModal';
import { UserSwitchModal } from './components/UserSwitchModal';
import { LineNotifyModal } from './components/LineNotifyModal';
import { DatabaseSettingsModal } from './components/DatabaseSettingsModal';
import { DownloadPackageModal } from './components/DownloadPackageModal';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_DRIVERS,
  INITIAL_MASTER_ITEMS,
} from './data/mockData';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  // Google Apps Script Web App URL
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxIUiWre_fj0Y2O9zkoGrnSK0qrbV-p6GOcRcni2v9mWxWzeDDn3Cm6fIYaF9kLhrWn/exec";
  // Core Data
  const [currentUser, setCurrentUser] = useState<User>(apiService.getActiveUser());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>(apiService.getVehicles());
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>(apiService.getMaintenanceItems());
  const [notifications, setNotifications] = useState<NotificationItem[]>(apiService.getNotifications());

  // 3D Theme System
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return storage.get<string>('theme', 'theme-frosted-glass');
  });

  // Modals
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isDbSettingsModalOpen, setIsDbSettingsModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Initialize theme on body
  useEffect(() => {
    document.body.className = currentTheme;
    storage.set('theme', currentTheme);
  }, [currentTheme]);

  // Load initial bookings & sync with authoritative Server Database
  useEffect(() => {
    const loadInitial = async () => {
      const serverData = await apiService.initDb();
      if (serverData) {
        if (serverData.vehicles && serverData.vehicles.length > 0) {
          setVehicles(serverData.vehicles);
        }
        if (serverData.bookings && serverData.bookings.length > 0) {
          setBookings(serverData.bookings);
        }
        if (serverData.maintenance && serverData.maintenance.length > 0) {
          setMaintenanceItems(serverData.maintenance);
        }
      } else {
        const data = await apiService.getBookings();
        setBookings(data);
        setVehicles(apiService.getVehicles());
        setMaintenanceItems(apiService.getMaintenanceItems());
      }
      setNotifications(apiService.getNotifications());
    };
    loadInitial();
  }, []);

  const handleSelectTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    document.body.className = themeId;
    storage.set('theme', themeId);
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    apiService.setActiveUser(user);
  };

  // Badge calculations
  const pendingApprovalsCount = bookings.filter(
    (b) => b.status === 'pending_dept' || b.status === 'pending_dir'
  ).length;

  const criticalMaintenanceCount = maintenanceItems.filter(
    (m) => m.status === 'critical'
  ).length;

  // Handlers for state updates
  const handleBookingCreated = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
    setNotifications(apiService.getNotifications());
    setActiveTab('approvals');
  };

  const handleBookingUpdated = (updatedBooking: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
    setNotifications(apiService.getNotifications());
  };

  const handleBookingDeleted = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    setNotifications(apiService.getNotifications());
  };

  const handleReturnVehicleSuccess = (updatedBooking: Booking, updatedVehicle: Vehicle) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
    setVehicles((prev) =>
      prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v))
    );
    setNotifications(apiService.getNotifications());
  };

  const handleMarkNotificationsRead = () => {
    apiService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenLineModal={() => setIsLineModalOpen(true)}
        onOpenDbSettingsModal={() => setIsDbSettingsModalOpen(true)}
        onOpenDownloadPackageModal={() => setIsDownloadModalOpen(true)}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
      />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenDbSettings={() => setIsDbSettingsModalOpen(true)}
          pendingApprovalsCount={pendingApprovalsCount}
          criticalMaintenanceCount={criticalMaintenanceCount}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              bookings={bookings}
              vehicles={vehicles}
              maintenanceItems={maintenanceItems}
              onStartBooking={() => setActiveTab('booking')}
              onSelectBooking={() => setActiveTab('approvals')}
              onNavigateMaintenance={() => setActiveTab('maintenance')}
              onNavigateApprovals={() => setActiveTab('approvals')}
              onNavigateCalendar={() => setActiveTab('calendar')}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarBookingView
              currentUser={currentUser}
              bookings={bookings}
              vehicles={vehicles}
              onSelectBooking={() => {}}
              onNavigateBooking={() => setActiveTab('booking')}
              onUpdateBooking={handleBookingUpdated}
              onDeleteBooking={handleBookingDeleted}
              onLogout={() => setIsUserModalOpen(true)}
            />
          )}

          {activeTab === 'booking' && (
            <BookingWizard
              currentUser={currentUser}
              vehicles={vehicles}
              onBookingSuccess={handleBookingCreated}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalView
              currentUser={currentUser}
              bookings={bookings}
              vehicles={vehicles}
              onUpdateBooking={handleBookingUpdated}
              onDeleteBooking={handleBookingDeleted}
            />
          )}

          {activeTab === 'masters' && (
            <MasterManagementView
              onOpenDbSettings={() => setIsDbSettingsModalOpen(true)}
              onRefreshData={() => {
                setVehicles(apiService.getVehicles());
              }}
            />
          )}

          {activeTab === 'drive' && (
            <GoogleDriveView
              currentUser={currentUser}
              bookings={bookings}
              vehicles={vehicles}
              repairOrders={[]}
              onNotify={(title, message, type) => {
                apiService.addNotification({
                  title,
                  message,
                  type,
                });
                setNotifications(apiService.getNotifications());
              }}
            />
          )}

          {activeTab === 'gps' && (
            <GPSTrackingView vehicles={vehicles} bookings={bookings} />
          )}

          {activeTab === 'return' && (
            <ReturnVehicleView
              currentUser={currentUser}
              bookings={bookings}
              vehicles={vehicles}
              onReturnSuccess={handleReturnVehicleSuccess}
            />
          )}

          {activeTab === 'fleet' && (
            <VehicleFleetView
              vehicles={vehicles}
              onUpdateVehicles={setVehicles}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              currentUser={currentUser}
              maintenanceItems={maintenanceItems}
              vehicles={vehicles}
              onUpdateMaintenance={setMaintenanceItems}
              onUpdateVehicles={setVehicles}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView bookings={bookings} vehicles={vehicles} />
          )}
        </main>
      </div>

      {/* 3D Theme Picker Modal (12 Themes) */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* User / Role Switcher Modal */}
      <UserSwitchModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />

      {/* Line Notify & Google Sheets Status Modal */}
      <LineNotifyModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
      />

      {/* Database & Google Apps Script Management Modal (100% Google Sheet Sync) */}
      <DatabaseSettingsModal
        isOpen={isDbSettingsModalOpen}
        onClose={() => setIsDbSettingsModalOpen(false)}
        bookings={bookings}
        vehicles={vehicles}
        maintenanceItems={maintenanceItems}
        onUpdateBookings={setBookings}
        onUpdateVehicles={setVehicles}
        onUpdateMaintenance={setMaintenanceItems}
      />

      {/* Download Center & Standalone Package Modal (.html, .gs, .md, .json, .zip) */}
      <DownloadPackageModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        vehicles={vehicles}
        bookings={bookings}
        users={apiService.getUsers()}
        departments={apiService.getDepartments()}
        drivers={apiService.getDrivers()}
        masters={apiService.getMasterItems()}
        maintenance={maintenanceItems}
        currentTheme={currentTheme}
      />
    </div>
  );
}
