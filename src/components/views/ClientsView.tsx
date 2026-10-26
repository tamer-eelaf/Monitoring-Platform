import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  PhoneCall,
  MessageSquare,
  Building,
  CreditCard,
  DollarSign,
  AlertCircle,
  Award,
  Briefcase,
  Layers,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Filter,
  CheckCircle2,
  MapPin,
  Mail,
  FileText,
  Sparkles,
  ArrowUpRight,
  Tag,
  Copy,
  Check,
  Edit3,
  Save,
  User,
  ShieldCheck
} from 'lucide-react';
import { EgyptClient, SalesOrder } from '../../types';
import { Pagination } from '../common/Pagination';
import { CURRENT_EXCHANGE_RATE } from '../../data/mockData';
import { StorageService } from '../../services/storageService';

interface ClientsViewProps {
  clients: EgyptClient[];
  orders?: SalesOrder[];
  onUpdateClient?: (updated: EgyptClient) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients: initialClients,
  orders = [],
  onUpdateClient,
}) => {
  // Local list of clients for instant updates
  const [clientList, setClientList] = useState<EgyptClient[]>(initialClients);

  // Sync if prop changes
  React.useEffect(() => {
    setClientList(initialClients);
  }, [initialClients]);

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'developers' | 'contractors'>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedClientModal, setSelectedClientModal] = useState<EgyptClient | null>(null);
  
  // Quick Edit Contact State
  const [editingClient, setEditingClient] = useState<EgyptClient | null>(null);
  const [editContactPerson, setEditContactPerson] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Copy Feedback State
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  const PAGE_SIZE = 8;

  const handleCopyPhone = (phone: string, clientId: string) => {
    try {
      navigator.clipboard.writeText(phone);
      setCopiedClientId(clientId);
      setTimeout(() => setCopiedClientId(null), 2500);
    } catch {
      // fallback
    }
  };

  const openEditModal = (client: EgyptClient) => {
    setEditingClient(client);
    setEditContactPerson(client.contactPerson || '');
    setEditPhone(client.phone || '');
    setEditEmail(client.email || '');
    setEditCity(client.city || '');
  };

  const handleSaveContact = () => {
    if (!editingClient) return;

    const updated: EgyptClient = {
      ...editingClient,
      contactPerson: editContactPerson.trim() || editingClient.contactPerson,
      phone: editPhone.trim() || editingClient.phone,
      email: editEmail.trim() || editingClient.email,
      city: editCity.trim() || editingClient.city,
    };

    const nextList = clientList.map((c) => (c.id === updated.id ? updated : c));
    setClientList(nextList);
    StorageService.saveClients(nextList);

    if (onUpdateClient) {
      onUpdateClient(updated);
    }

    if (selectedClientModal && selectedClientModal.id === updated.id) {
      setSelectedClientModal(updated);
    }

    setEditSuccessMsg(`تم تحديث بيانات الاتصال للعميل ${updated.name} بنجاح!`);
    setTimeout(() => {
      setEditSuccessMsg(null);
      setEditingClient(null);
    }, 1200);
  };

  // 1. Comprehensive Filtering
  const filteredClients = useMemo(() => {
    return clientList.filter((c) => {
      // Category Filter (Developers/Strategic Accounts vs Contractors)
      if (selectedCategory === 'developers') {
        if (c.clientType !== 'developer_account' && c.clientType !== 'enterprise_corporate') {
          return false;
        }
      } else if (selectedCategory === 'contractors') {
        if (c.clientType === 'developer_account' || c.clientType === 'enterprise_corporate') {
          return false;
        }
      }

      // Brand Filter
      if (selectedBrand !== 'all' && c.primaryBrand !== selectedBrand) {
        return false;
      }

      // Smart Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchNameAr = (c.nameAr || '').toLowerCase().includes(q);
        const matchContact = (c.contactPerson || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').includes(q);
        const matchCity = (c.city || '').toLowerCase().includes(q);
        const matchRep = (c.assignedRepName || '').toLowerCase().includes(q);
        const matchIndustry = (c.industry || '').toLowerCase().includes(q);
        
        // Search inside associated projects (e.g. searching "Badya", "PX Buildings", "Palm X")
        const matchProject = c.projects?.some((p) => p.toLowerCase().includes(q));
        // Search inside executing contractors
        const matchContractor = c.associatedContractors?.some((con) => con.toLowerCase().includes(q));

        if (!matchName && !matchNameAr && !matchContact && !matchPhone && !matchCity && !matchRep && !matchIndustry && !matchProject && !matchContractor) {
          return false;
        }
      }

      return true;
    });
  }, [clientList, selectedCategory, selectedBrand, search]);

  const paginatedClients = useMemo(() => {
    return filteredClients.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );
  }, [filteredClients, currentPage]);

  // Total summary metrics
  const totalVolumeUSD = useMemo(() => {
    return clientList.reduce((sum, c) => sum + (c.totalPurchasedUSD || 0), 0);
  }, [clientList]);

  const strategicAccountsCount = useMemo(() => {
    return clientList.filter((c) => c.clientType === 'developer_account' || c.clientType === 'enterprise_corporate').length;
  }, [clientList]);

  // Helper to extract orders for a specific client
  const getClientOrders = (client: EgyptClient): SalesOrder[] => {
    if (!orders || orders.length === 0) return [];
    const cName = (client.name || '').toLowerCase();
    
    // Strategic account matching (e.g. Palm Hills, TMG, Mostakbal Misr)
    if (client.clientType === 'developer_account' || client.clientType === 'enterprise_corporate') {
      const keywords: string[] = [];
      if (cName.includes('palm')) keywords.push('palm');
      else if (cName.includes('talaat') || cName.includes('tmg') || cName.includes('madinaty')) keywords.push('talaat', 'madinaty', 'rehab', 'celia', 'noor');
      else if (cName.includes('mostakbal') || cName.includes('pharaonic')) keywords.push('mostakbal', 'pharaonic');
      else if (cName.includes('emaar')) keywords.push('emaar', 'uptown', 'mivida', 'marassi');
      else if (cName.includes('sodic')) keywords.push('sodic', 'villette', 'allegria', 'karmell');
      else if (cName.includes('capital')) keywords.push('capital', 'r5', 'r3', 'العاصمة');
      else if (cName.includes('bank')) keywords.push('bank', 'nbe', 'cib', 'qnb', 'بنك');
      else if (cName.includes('armed') || cName.includes('military')) keywords.push('army', 'military', 'defence', 'defense', 'قوات', 'جيش');

      if (keywords.length > 0) {
        return orders.filter((o) => {
          const opp = (o.opportunity || '').toLowerCase();
          const cust = (o.customerName || '').toLowerCase();
          return keywords.some((kw) => opp.includes(kw) || cust.includes(kw));
        });
      }
    }

    // Direct contractor matching
    return orders.filter((o) => {
      const cust = (o.customerName || '').toLowerCase();
      return cust === cName || cust.includes(cName);
    });
  };

  const activeModalOrders = selectedClientModal ? getClientOrders(selectedClientModal) : [];

  return (
    <div className="space-y-5">
      {/* 1. Header with Executive Identity & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
                <Users className="w-3.5 h-3.5" />
                EGYPT BU CLIENTS & DEVELOPER ACCOUNTS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono">
                {clientList.length} عميل وحساب استراتيجي
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800 font-mono flex items-center gap-1">
                <Phone className="w-3 h-3" />
                شامل أسماء وأرقام الاتصال المباشرة
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              دليل العملاء وبيانات الاتصال المباشرة (Client Contacts & Directory)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              دليل شامل ومحدث يعرض <strong>اسم مسؤول الاتصال ورقم الهاتف المباشر</strong> لكل عميل، مع إمكانية الاتصال أو إرسال رسالة واتساب بنقرة واحدة، وتعديل بيانات الاتصال وحفظها فورياً.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-left font-mono">
              <div className="text-[10px] text-slate-400 font-sans">إجمالي قيمة التوريدات للعملاء:</div>
              <div className="text-base font-black text-emerald-400">
                ${Math.round(totalVolumeUSD).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Accounts Notice Banner */}
        <div className="mt-4 p-3 rounded-xl bg-blue-950/30 border border-blue-800/50 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-200 leading-relaxed">
            <span className="font-bold text-amber-300">ملاحظة تنظيمية: </span>
            تظهر حسابات المطورين العقاريين الكبرى (مثل <strong className="text-emerald-300">Palm Hills Developments - بالم هيلز</strong>) كحساب استراتيجي موحد يجمع كافة مشاريعها (<strong className="text-slate-300">Badya، PX Buildings، Palm Hills New Cairo، Palm X، Palm Mall</strong>) المنفذة عبر موزعي ومقاولي Odoo، مع ظهور اسم وتليفون مسؤول الاتصال لكل حساب.
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل ({clientList.length})
            </button>
            <button
              onClick={() => {
                setSelectedCategory('developers');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'developers'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>كبار المطورين والعملاء الاستراتيجيين ({strategicAccountsCount})</span>
            </button>
            <button
              onClick={() => {
                setSelectedCategory('contractors');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'contractors'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>شركات المقاولات وتكامل النظم ({clientList.length - strategicAccountsCount})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ابحث باسم العميل (مثل Palm Hills)، التليفون، المسؤول..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg py-2 pr-9 pl-8 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Bar: Brand Filter & Quick Click Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">التوكيل:</span>
            {['all', 'Hikvision', 'Velasea', 'AMG'].map((b) => (
              <button
                key={b}
                onClick={() => {
                  setSelectedBrand(b);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedBrand === b
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {b === 'all' ? 'جميع البراندات' : b}
              </button>
            ))}
          </div>

          {/* Quick Search Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-500">حسابات شائعة:</span>
            {[
              { label: 'بالم هيلز (Palm Hills)', query: 'palm' },
              { label: 'طلعت مصطفى (TMG)', query: 'talaat' },
              { label: 'مستقبل مصر', query: 'mostakbal' },
              { label: 'إعمار مصر', query: 'emaar' },
              { label: 'سوديك (SODIC)', query: 'sodic' },
            ].map((item) => (
              <button
                key={item.query}
                onClick={() => {
                  setSearch(item.query);
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Clients Cards Grid */}
      {paginatedClients.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-slate-200">لا يوجد عملاء مطابقون للبحث</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            لم نتمكن من العثور على أي عميل مطابق لـ &quot;{search}&quot;. جرب البحث بكلمة أخرى أو اضغط على &quot;جميع العملاء&quot;.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setSelectedBrand('all');
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            إعادة تعيين البحث
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedClients.map((client) => {
            const isStrategic = client.clientType === 'developer_account' || client.clientType === 'enterprise_corporate';
            const clientOrders = getClientOrders(client);
            const ordersCount = client.ordersCount || clientOrders.length;
            const isCopied = copiedClientId === client.id;
            const cleanPhone = (client.phone || '').replace(/\s+/g, '');
            const waNumber = (client.phone || '').replace(/[^0-9]/g, '');

            return (
              <div
                key={client.id}
                className={`border rounded-2xl p-4 transition-all space-y-3 flex flex-col justify-between ${
                  isStrategic
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 border-blue-800/80 hover:border-blue-600 shadow-lg ring-1 ring-blue-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isStrategic ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                            <Award className="w-3 h-3 text-amber-400" />
                            مطور استراتيجي (Developer)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            موزع / مقاول معتمد
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            client.primaryBrand === 'Hikvision'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : client.primaryBrand === 'Velasea'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : client.primaryBrand === 'AMG'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {client.primaryBrand}
                        </span>

                        <span className="text-[10px] font-mono text-slate-500">
                          ID: #{client.odooPartnerId}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                        {client.name}
                      </h3>
                      {client.nameAr && client.nameAr !== client.name && (
                        <div className="text-xs text-blue-300/80 font-medium">
                          {client.nameAr}
                        </div>
                      )}

                      <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                        <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{client.industry || 'قطاع المقاولات والأنظمة'}</span>
                        <span className="text-slate-600">•</span>
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{client.city || 'القاهرة'}</span>
                      </div>
                    </div>

                    <div className="text-left font-mono shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          client.creditRating.startsWith('A')
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : client.creditRating === 'B'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        تصنيف: {client.creditRating}
                      </span>
                    </div>
                  </div>

                  {/* PROMINENT CONTACT PERSON & PHONE BADGE (Requested by user) */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-blue-900/40 bg-gradient-to-r from-blue-950/20 via-slate-950 to-slate-950 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>مسؤول الاتصال بالعميل:</span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                          {client.contactPerson || 'إدارة المشتريات والمشروعات'}
                        </div>
                      </div>

                      <button
                        onClick={() => openEditModal(client)}
                        className="px-2 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer shrink-0"
                        title="تعديل بيانات الاتصال والهاتف"
                      >
                        <Edit3 className="w-3 h-3 text-blue-400" />
                        <span>تعديل</span>
                      </button>
                    </div>

                    {/* Direct Phone & Quick Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-black font-mono text-emerald-300 tracking-wide dir-ltr">
                          {client.phone}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Direct Call Button */}
                        <a
                          href={`tel:${cleanPhone}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                          title="اتصال هاتفي مباشر"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>اتصال</span>
                        </a>

                        {/* WhatsApp Button */}
                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                          title="محادثة واتساب مباشرة"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>واتساب</span>
                        </a>

                        {/* Copy Phone */}
                        <button
                          onClick={() => handleCopyPhone(client.phone, client.id)}
                          className={`p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="نسخ رقم الهاتف"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Financial Snapshot */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs mt-3">
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
                        <span>إجمالي التوريدات (USD)</span>
                        <span className="text-slate-500 text-[9px]">{ordersCount} أوامر</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-slate-100 mt-0.5">
                        ${client.totalPurchasedUSD.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ~EGP {Math.round((client.totalPurchasedUSD * CURRENT_EXCHANGE_RATE) / 1000).toLocaleString()}K
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        المديونية المتبقية
                      </div>
                      <div
                        className={`text-sm sm:text-base font-black mt-0.5 ${
                          client.outstandingBalanceUSD > 0
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        ${client.outstandingBalanceUSD.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {client.outstandingBalanceUSD > 0 ? 'مستحق السداد' : 'رصيد منتظم'}
                      </div>
                    </div>
                  </div>

                  {/* Associated Projects (Crucial for Palm Hills, etc.) */}
                  {client.projects && client.projects.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-400" />
                        <span>المشروعات والفرص التابعة ({client.projects.length} مشاريع):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {client.projects.slice(0, 4).map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-slate-300 border border-slate-800 font-sans"
                          >
                            {p}
                          </span>
                        ))}
                        {client.projects.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                            +{client.projects.length - 4} أخرى
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Executing Contractors (for developers) */}
                  {client.associatedContractors && client.associatedContractors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <Building className="w-3 h-3 text-emerald-400" />
                        <span>الشركات المنفذة بالمشروع:</span>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {client.associatedContractors.slice(0, 3).join(' • ')}
                        {client.associatedContractors.length > 3 && ` و+${client.associatedContractors.length - 3} أخرى`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Sales Rep & Order Inspection Button */}
                <div className="space-y-2 border-t border-slate-800/80 pt-2.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">المسؤول بالمبيعات:</span>
                    <span className="font-semibold text-emerald-400">
                      {client.assignedRepName || 'فريق مبيعات الإدارة'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-slate-400 font-mono">
                      آخر تعامل: {client.lastOrderDate || '2026-10-22'}
                    </div>

                    <button
                      onClick={() => setSelectedClientModal(client)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <span>عرض تفاصيل الأوامر ({ordersCount})</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredClients.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {/* 5. Client Orders & Dossier Modal */}
      {selectedClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {selectedClientModal.clientType === 'developer_account' ? 'ملف مطور استراتيجي' : 'ملف عميل معتمد'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: #{selectedClientModal.odooPartnerId}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                  {selectedClientModal.name}
                </h2>
                {selectedClientModal.nameAr && (
                  <div className="text-xs text-blue-300 font-medium">
                    {selectedClientModal.nameAr}
                  </div>
                )}
                {selectedClientModal.notes && (
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedClientModal.notes}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedClientModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {/* Prominent Contact Banner in Modal */}
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>مسؤول الاتصال المباشر:</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-100">
                    {selectedClientModal.contactPerson}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{selectedClientModal.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-bold font-mono text-emerald-300 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 dir-ltr">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>{selectedClientModal.phone}</span>
                  </div>
                  <a
                    href={`tel:${selectedClientModal.phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>اتصال</span>
                  </a>
                  <a
                    href={`https://wa.me/${selectedClientModal.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                </div>
              </div>

              {/* Client Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">إجمالي التوريدات</div>
                  <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                    ${selectedClientModal.totalPurchasedUSD.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    EGP {Math.round((selectedClientModal.totalPurchasedUSD * CURRENT_EXCHANGE_RATE) / 1000).toLocaleString()}K
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">عدد أوامر البيع</div>
                  <div className="text-base font-black text-blue-400 font-mono mt-0.5">
                    {activeModalOrders.length || selectedClientModal.ordersCount || 0} أمر
                  </div>
                  <div className="text-[10px] text-slate-500">من واقع شيت المبيعات</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">التوكيل الأساسي</div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {selectedClientModal.primaryBrand}
                  </div>
                  <div className="text-[10px] text-slate-500">Security Division</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">تصنيف الائتمان</div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {selectedClientModal.creditRating}
                  </div>
                  <div className="text-[10px] text-slate-500">ملاءة ممتازة</div>
                </div>
              </div>

              {/* Projects List if any */}
              {selectedClientModal.projects && selectedClientModal.projects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>المشروعات والمواقع التابعة ({selectedClientModal.projects.length}):</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClientModal.projects.map((proj, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2.5 py-1 rounded-md text-xs bg-slate-950 text-slate-200 border border-slate-800 flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3 text-blue-400" />
                        <span>{proj}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>سجل أوامر البيع والتعاقدات الفعلية ({activeModalOrders.length}):</span>
                  </h4>
                  <span className="text-slate-400 font-mono">
                    مجموع الأوامر: ${Math.round(activeModalOrders.reduce((s, o) => s + o.totalUSD, 0)).toLocaleString()}
                  </span>
                </div>

                {activeModalOrders.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    لا تتوفر أوامر بيع مباشرة في نطاق العرض الحالي.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 text-[11px] font-mono border-b border-slate-800">
                            <th className="py-2.5 px-3">رقم الأمر</th>
                            <th className="py-2.5 px-3">التاريخ</th>
                            <th className="py-2.5 px-3">المشروع / الفرصة</th>
                            <th className="py-2.5 px-3">المقاول / العميل المنفذ</th>
                            <th className="py-2.5 px-3">المسؤول</th>
                            <th className="py-2.5 px-3 text-left">الصافي ($)</th>
                            <th className="py-2.5 px-3 text-left">الإجمالي ($)</th>
                            <th className="py-2.5 px-3 text-center">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                          {activeModalOrders.map((ord) => {
                            const untaxed = ord.untaxedUSD || Math.round(ord.totalUSD / 1.14);
                            return (
                              <tr key={ord.id || ord.odooName} className="hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 text-blue-400 font-bold">
                                  {ord.odooName}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">
                                  {ord.date}
                                </td>
                                <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                                  {ord.opportunity || 'توريد أنظمة أمنية'}
                                </td>
                                <td className="py-2.5 px-3 font-sans text-slate-300">
                                  {ord.customerName}
                                </td>
                                <td className="py-2.5 px-3 font-sans text-emerald-400">
                                  {ord.salesRepName}
                                </td>
                                <td className="py-2.5 px-3 text-left text-slate-300">
                                  ${Math.round(untaxed).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-left font-bold text-slate-100">
                                  ${Math.round(ord.totalUSD).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                                      ord.status === 'confirmed' || ord.rawStatus === 'Sales Order'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : 'bg-slate-800 text-slate-300'
                                    }`}
                                  >
                                    {ord.rawStatus || ord.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                Physical Security BU — EELAF Egypt S.A.E.
              </span>
              <button
                onClick={() => setSelectedClientModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Contact Information Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  تعديل بيانات الاتصال للعميل: {editingClient.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">اسم مسؤول الاتصال والوظيفة:</label>
                <input
                  type="text"
                  value={editContactPerson}
                  onChange={(e) => setEditContactPerson(e.target.value)}
                  placeholder="مثال: م. أحمد عبد العزيز (مدير مشروعات التيار الخفيف)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">رقم الهاتف / المحمول المباشر:</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="مثال: +20 100 234 5678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500 font-mono dir-ltr text-right"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">البريد الإلكتروني المؤسسي:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="example@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500 font-mono dir-ltr text-right"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">المدينة والمقر:</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="مثال: القاهرة / التجمع الخامس"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveContact}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
