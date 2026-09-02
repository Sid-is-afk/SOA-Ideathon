import React, { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '../components/AppHeader';
import { FreshnessGauge } from '../components/FreshnessGauge';
import { IncidentModal } from '../components/IncidentModal';
import { KarwaanMap } from '../components/KarwaanMap';
import { KarwaanChatbot } from '../components/KarwaanChatbot';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import { DeliveryRoute, Shipment, IncidentReport, User } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Truck,
  Check,
  PackageOpen,
  Flag,
  LogOut,
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  const [completedStopIds, setCompletedStopIds] = useState<Set<string>>(new Set());

  const isMumbatan = user?.email?.toLowerCase() === 'mumbatan199@gmail.com';

  // Route selection priority — NEVER surface a completed route when an active one exists.
  const myRoute = (() => {
    // 1. Explicit assignment via user.assignedRouteId (non-completed only)
    if (user?.assignedRouteId) {
      const r = routes.find(r =>
        (r.id === user.assignedRouteId || r.code === user.assignedRouteId) &&
        r.status !== 'completed'
      );
      if (r) return r;
    }

    // 2. Explicit assignment via user.assignedVehicleId (non-completed only)
    if (user?.assignedVehicleId) {
      const r = routes.find(r =>
        r.vehicleId?.includes(user.assignedVehicleId?.split(' ')[0] || '') &&
        r.status !== 'completed'
      );
      if (r) return r;
    }

    // 3. Demo user: find the Ashok Leyland route — but ONLY if it's active
    if (isMumbatan) {
      const r = routes.find(r =>
        (r.vehicleId?.includes('OD-07-H-8821') || r.id.includes('8287')) &&
        r.status !== 'completed'
      );
      if (r) return r;
    }

    // 4. Any route currently in_transit
    const inTransit = routes.find(r => r.status === 'in_transit');
    if (inTransit) return inTransit;

    // 5. Any scheduled (not yet started) route
    const scheduled = routes.find(r => r.status === 'scheduled');
    if (scheduled) return scheduled;

    // 6. Nothing active — return null so "No Active Route" is shown
    return null;
  })();

  // Use DB status as source of truth — survives page refreshes
  const isRouteCompleted = myRoute?.status === 'completed';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const u = await dataService.getActiveUser();
      const r = await dataService.getRoutes();
      const s = await dataService.getShipments();
      const i = await dataService.getIncidents();
      
      if (u) setUser(u);
      setRoutes(r);
      setShipments(s);
      setIncidents(i);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleMarkStopComplete = async (stopId: string) => {
    if (!myRoute) return;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Instantly track completed stop in component state
    setCompletedStopIds((prev) => new Set(prev).add(stopId));

    // Optimistically update stops state in UI
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === myRoute.id) {
          const updatedStops = (r.stops || []).map((s) =>
            s.id === stopId ? { ...s, isCompleted: true, completedTime: timeStr } : s
          );
          return { ...r, stops: updatedStops };
        }
        return r;
      })
    );

    try {
      await dataService.markStopCompleted(myRoute.id, stopId);
      const [r, s] = await Promise.all([dataService.getRoutes(), dataService.getShipments()]);
      setRoutes(r);
      setShipments(s);
    } catch (err: any) {
      console.error("Failed to mark stop completed:", err);
    }
  };

  const handleFinishDelivery = async () => {
    if (!myRoute || isFinishing) return;
    setIsFinishing(true);
    try {
      await dataService.completeRoute(myRoute.id);
      // Refresh from DB
      const [r, s] = await Promise.all([dataService.getRoutes(), dataService.getShipments()]);
      setRoutes(r);
      setShipments(s);
    } catch (err: any) {
      alert(`Failed to complete route: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('karwaan_token');
    window.location.href = '/';
  };

  const { nextStop, completedStopsCount, totalStopsCount, progressPercent, activeIncidents } = useMemo(() => {
    if (!myRoute || !myRoute.stops) return { nextStop: null, completedStopsCount: 0, totalStopsCount: 0, progressPercent: 0, activeIncidents: [] };
    
    const next = myRoute.stops.find(s => !s.isCompleted && !completedStopIds.has(s.id));
    const completed = myRoute.stops.filter(s => s.isCompleted || completedStopIds.has(s.id)).length;
    const total = myRoute.stops.length;
    const activeInc = incidents.filter(i => i.routeId === myRoute.id && i.status === 'open');
    
    return {
      nextStop: next,
      completedStopsCount: completed,
      totalStopsCount: total,
      progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      activeIncidents: activeInc
    };
  }, [myRoute, incidents, completedStopIds]);

  const getStopTypeLabel = (type: string) => {
    switch (type) {
      case 'pickup':
        return t('driver.typePickup', 'Pickup');
      case 'consolidation_hub':
      case 'hub_transfer':
        return t('driver.typeConsolidation', 'Consolidation Hub');
      case 'rail_loading':
        return t('driver.typeRailLoading', 'Rail Loading');
      case 'rail_unloading':
        return t('driver.typeRailUnloading', 'Rail Unloading');
      case 'delivery':
        return t('driver.typeDelivery', 'Delivery');
      default:
        return type.replace('_', ' ');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Truck className="w-12 h-12 text-[#5C7A50]" />
          <span className="font-mono text-sm text-[#596560] font-medium tracking-wide">
            {t('driver.syncingManifest', 'Syncing Route Manifest...')}
          </span>
        </div>
      </div>
    );
  }

  if (!myRoute) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex flex-col font-sans">
        <AppHeader user={user} activeRole="agent" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-[#E5EBE3] rounded-2xl p-10 max-w-md w-full text-center shadow-sm relative">
            <button onClick={handleLogout} className="absolute top-4 right-4 p-2 text-[#596560] hover:bg-[#F3F5F2] rounded-lg transition-colors cursor-pointer">
              <LogOut className="w-5 h-5" />
            </button>
            <Truck className="w-16 h-16 text-[#D6DCD4] mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-[#163832] mb-2">
              {t('driver.noActiveRouteTitle', 'No Active Route')}
            </h2>
            <p className="text-[#596560] text-sm leading-relaxed">
              {t('driver.noActiveRouteSub', 'You are currently unassigned. Dispatch will notify you when a new consolidation manifest is ready.')}
            </p>
          </div>
        </main>
        <KarwaanChatbot role="agent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#1A211E] flex flex-col font-sans pb-12">
      <AppHeader user={user} activeRole="agent" />

      {isRouteCompleted && (
        <div className="bg-[#5C7A50] text-white text-center py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 border-[#435A3A]">
          <CheckCircle2 className="w-4 h-4" /> {t('driver.routeDeliveredBanner', 'Route marked DELIVERED. All shipments updated. Well done, Captain!')}
        </div>
      )}

      <div className="bg-[#163832] text-white border-b-4 border-[#D98E2B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono font-bold text-xs tracking-wider px-2.5 py-1 bg-[#D98E2B] text-[#163832] rounded-md shadow-sm">
                {myRoute.code}
              </span>
              <span className="text-white/80 text-sm font-medium flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">
                <Truck className="w-4 h-4"/> 
                {myRoute.vehicleId || 'Unknown Vehicle'}
              </span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight">{myRoute.name}</h1>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t('common.signOut', 'Sign Out')}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5EBE3]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-lg text-[#163832]">
                  {t('driver.routeStatus', 'Route Status')}
                </h3>
                <span className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm ${activeIncidents.length > 0 ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-[#F3F5F2] text-[#5C7A50] border border-[#D6DCD4]'}`}>
                  {activeIncidents.length > 0 ? t('driver.incidentActive', '⚠️ INCIDENT ACTIVE') : t('driver.onSchedule', 'ON SCHEDULE')}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[#596560]">{t('driver.overallProgress', 'Overall Progress')}</span>
                  <span className="text-[#163832] font-bold">
                    {completedStopsCount} of {totalStopsCount} {t('driver.stopsCount', 'Stops')}
                  </span>
                </div>
                <div className="w-full bg-[#F3F5F2] h-4 rounded-full overflow-hidden shadow-inner border border-[#E5EBE3]">
                  <div className="bg-[#5C7A50] h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${progressPercent}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-8 border-t border-[#E5EBE3] pt-6">
                <div className="text-center bg-[#F8FAF7] p-2 rounded-lg border border-[#E5EBE3]">
                  <span className="block text-[10px] font-bold tracking-widest text-[#596560] mb-1">
                    {t('driver.cabinTemp', 'CABIN')}
                  </span>
                  <span className={`font-mono font-bold text-xl ${activeIncidents.length > 0 ? 'text-red-600' : 'text-[#163832]'}`}>
                    {activeIncidents.length > 0 ? '+5.6°' : '+2.8°'}
                  </span>
                </div>
                <div className="text-center bg-[#F8FAF7] p-2 rounded-lg border border-[#E5EBE3]">
                  <span className="block text-[10px] font-bold tracking-widest text-[#596560] mb-1">
                    {t('driver.targetTemp', 'TARGET')}
                  </span>
                  <span className="font-mono font-bold text-xl text-[#596560]">1.5-4°</span>
                </div>
                <div className="text-center bg-[#F8FAF7] p-2 rounded-lg border border-[#E5EBE3]">
                  <span className="block text-[10px] font-bold tracking-widest text-[#596560] mb-1">
                    {t('driver.reeferPower', 'POWER')}
                  </span>
                  <span className="font-mono font-bold text-xl text-[#5C7A50]">92%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E5EBE3]">
              <h3 className="font-display font-bold text-base text-[#163832] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D98E2B]"/> {t('driver.liveMap', 'Live Routing Map')}
              </h3>
              <div className="rounded-xl overflow-hidden border border-[#D6DCD4] shadow-inner">
                <KarwaanMap routes={[myRoute]} selectedRouteId={myRoute.id} height="280px" showAllControls={false} showLegend={false} />
              </div>
            </div>

            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="w-full py-4 bg-white hover:bg-rose-50 border-2 border-[#B3462C] text-[#B3462C] rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5" /> {t('driver.reportIncident', 'Report Incident')}
            </button>

            {progressPercent === 100 && !isRouteCompleted && (
              <button
                onClick={handleFinishDelivery}
                disabled={isFinishing}
                className={`w-full py-5 rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center gap-3 border-2 bg-[#163832] hover:bg-[#0F2622] text-white border-[#163832] animate-pulse cursor-pointer ${isFinishing ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
              >
                <Flag className="w-5 h-5" />
                {isFinishing ? t('driver.completingDelivery', 'Completing Delivery...') : t('driver.finishDelivery', '🎉 FINISH DELIVERY')}
              </button>
            )}
          </div>

          <div className="lg:col-span-8">
            <h2 className="font-display font-bold text-2xl text-[#163832] px-1 mb-6">
              {t('driver.manifestSequence', 'Manifest & Stop Sequence')}
            </h2>
            
            {(!myRoute.stops || myRoute.stops.length === 0) ? (
              <div className="bg-white border border-[#E5EBE3] border-dashed rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center h-[400px]">
                <div className="bg-[#F8FAF7] p-5 rounded-full mb-4">
                  <PackageOpen className="w-12 h-12 text-[#D98E2B]" />
                </div>
                <h3 className="font-display font-bold text-xl text-[#163832] mb-2">
                  {t('driver.standbyTitle', 'Fleet on Standby (0 Consignments)')}
                </h3>
                <p className="text-[#596560] max-w-md mx-auto text-sm leading-relaxed">
                  {t('driver.standbySub', 'No orders have been dispatched to this fleet yet. Once the Admin consolidates shipments and dispatches them to this vehicle, the manifest will appear here automatically.')}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {myRoute.stops.map((stop) => {
                  const isCompleted = stop.isCompleted || completedStopIds.has(stop.id);
                  const isNext = !isCompleted && nextStop?.id === stop.id;
                  const stopShipments = shipments.filter((s) => stop.shipmentIds.includes(s.id));
                  const displayTime = stop.completedTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={stop.id} className={`bg-white rounded-2xl p-6 transition-all relative overflow-hidden ${
                        isCompleted ? 'border border-[#E5EBE3] opacity-60 bg-[#FAFBF9]' : 
                        isNext ? 'border-2 border-[#D98E2B] shadow-lg transform lg:-translate-x-3 bg-white' : 
                        'border border-[#D6DCD4] shadow-sm hover:shadow-md'
                      }`}
                    >
                      {isNext && <div className="absolute top-0 left-0 w-2 h-full bg-[#D98E2B]" />}
                      
                      <div className="flex flex-col sm:flex-row gap-5 justify-between">
                        <div className="flex gap-5 flex-1">
                          
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black shrink-0 shadow-sm text-lg ${
                              isCompleted ? 'bg-[#5C7A50] text-white' : 
                              isNext ? 'bg-[#D98E2B] text-[#163832]' : 
                              'bg-[#F3F5F2] text-[#596560]'
                            }`}
                          >
                            {isCompleted ? <Check className="w-6 h-6" /> : stop.sequence}
                          </div>

                          <div className="space-y-1.5 w-full">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-[#F3F5F2] text-[#163832] border border-[#D6DCD4]">
                                {getStopTypeLabel(stop.type)}
                              </span>
                              <span className="text-sm font-mono font-bold text-[#596560] flex items-center gap-1.5 bg-[#F8FAF7] px-2 py-0.5 rounded border border-[#E5EBE3]">
                                <Clock className="w-3.5 h-3.5 text-[#5C7A50]" /> {stop.scheduledTime}
                              </span>
                            </div>
                            <h3 className={`font-display font-black leading-tight mt-2 ${isNext ? 'text-2xl text-[#163832]' : 'text-xl text-[#1A211E]'}`}>
                              {stop.name}
                            </h3>
                            <p className="text-sm text-[#596560] max-w-lg leading-relaxed">{stop.address}</p>
                            
                            {stopShipments.length > 0 && (
                              <div className="pt-4 flex flex-wrap gap-2">
                                {stopShipments.map(shp => (
                                  <div key={shp.id} className="bg-white border border-[#D6DCD4] rounded-lg px-3 py-2 flex items-center gap-3 text-xs shadow-sm">
                                    <span className="font-mono font-black text-[#163832] bg-[#F3F5F2] px-1.5 py-0.5 rounded">{shp.code}</span>
                                    <span className="text-[#596560] hidden sm:inline font-medium">{shp.cargoType}</span>
                                    <FreshnessGauge percentage={shp.freshnessPercent} size="mini" predictedRiskLevel={shp.spoilageRiskLevel} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-0 sm:ml-4 sm:w-44 flex flex-col justify-center">
                          {!isCompleted ? (
                             <button
                               onClick={() => handleMarkStopComplete(stop.id)}
                               disabled={!isNext}
                               className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 touch-manipulation tracking-wide cursor-pointer ${
                                 isNext 
                                 ? 'bg-[#5C7A50] hover:bg-[#435A3A] text-white shadow-md active:scale-95 border border-[#435A3A]' 
                                 : 'bg-[#F3F5F2] text-[#A3ADA8] cursor-not-allowed border border-[#E5EBE3]'
                               }`}
                             >
                               <CheckCircle2 className="w-5 h-5" />
                               {isNext ? t('driver.btnComplete', 'COMPLETE') : t('driver.btnLocked', 'LOCKED')}
                             </button>
                          ) : (
                            <div className="w-full py-3 bg-[#F8FAF7] text-[#5C7A50] border border-[#E5EBE3] rounded-xl text-center text-sm font-bold flex flex-col items-center justify-center gap-1.5 shadow-inner">
                              <CheckCircle2 className="w-6 h-6" />
                              <span className="text-[10px] uppercase font-mono tracking-widest opacity-80">
                                {t('driver.doneAt', 'Done at')} {displayTime}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {progressPercent === 100 && !isRouteCompleted && (
                  <div className="bg-[#163832] border-2 border-[#D98E2B] rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 animate-in fade-in zoom-in duration-300">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-[#D98E2B]" />
                        <h4 className="font-display font-black text-xl text-[#F8FAF7]">
                          {t('driver.allWaypointsDoneTitle', 'All Waypoints Successfully Completed!')}
                        </h4>
                      </div>
                      <p className="text-xs text-white/80 font-mono">
                        {t('driver.allWaypointsDoneSub', 'Consignment delivery verified at destination. Click below to close the manifest and update all shipment states.')}
                      </p>
                    </div>

                    <button
                      onClick={handleFinishDelivery}
                      disabled={isFinishing}
                      className={`px-8 py-4 rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center gap-3 bg-[#D98E2B] hover:bg-[#C07B20] text-[#163832] whitespace-nowrap active:scale-95 cursor-pointer ${
                        isFinishing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      <Flag className="w-5 h-5" />
                      {isFinishing ? t('driver.completingDelivery', 'Completing Delivery...') : t('driver.finishDelivery', '🎉 FINISH DELIVERY')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        routes={myRoute ? [myRoute] : routes}
        shipments={shipments}
        preselectedRouteId={myRoute.id}
        variant="driver"
        onIncidentSubmitted={async () => {
          setIncidents(await dataService.getIncidents());
          setRoutes(await dataService.getRoutes());
          setShipments(await dataService.getShipments());
        }}
      />

      {/* Floating Chatbot for Delivery Agent */}
      <KarwaanChatbot role="agent" contextData={{ myRoute }} />
    </div>
  );
};