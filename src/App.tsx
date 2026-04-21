import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { 
  ShoppingBag, 
  Store, 
  User as UserIcon, 
  Settings, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Calendar,
  Sparkles,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, User, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db, COLLECTIONS } from "./lib/firebase";
import { LocalinkUser, Shop, Product, Employee, Shift } from "./types";
import { CartProvider, useCart } from "./contexts/CartContext";
import { cn, formatPrice } from "./lib/utils";
import { generateProductDescription } from "./lib/gemini";
import { useLocation } from "react-router-dom";

// --- Components ---

const Navbar = ({ userProfile }: { userProfile: LocalinkUser | null }) => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const isAdmin = userProfile?.role === "admin";

  const isShop = userProfile?.role === "shop";

  return (
    <nav className={cn(
      "sticky top-0 z-50 px-4 py-4 md:px-12 transition-all",
      isAdmin || isShop ? "bg-white/95 border-b border-zinc-200" : "bg-white/80 backdrop-blur-md border-b border-zinc-200"
    )}>
      <div className="mx-auto max-w-7xl flex items-center justify-between font-medium">
        <Link to="/" className="flex items-center space-x-2 shrink-0">
          <span className={cn("text-xl tracking-tight text-zinc-800")}>
            La Revolución del Comercio Online
          </span>
        </Link>

        {(isAdmin || isShop) && (
          <div className="flex items-center space-x-8 absolute left-1/2 -translate-x-1/2 pr-20 whitespace-nowrap">
            {isAdmin ? (
              <>
                <Link to="/admin?tab=shops" className="text-zinc-500 hover:text-primary transition-colors text-sm">Tiendas</Link>
                <Link to="/admin?tab=users" className="text-zinc-500 hover:text-primary transition-colors text-sm">Gestión de Usuarios</Link>
              </>
            ) : (
              <>
                <Link to={`/tienda/${userProfile?.shopId}/dashboard?tab=home`} className="text-zinc-500 hover:text-primary transition-colors text-sm">Tiendas</Link>
                <Link to={`/tienda/${userProfile?.shopId}/dashboard?tab=products`} className="text-zinc-500 hover:text-primary transition-colors text-sm">Gestión de Productos</Link>
                <Link to={`/tienda/${userProfile?.shopId}/dashboard?tab=schedules`} className="text-zinc-500 hover:text-primary transition-colors text-sm">Gestión de Horarios</Link>
                <Link to={`/tienda/${userProfile?.shopId}/dashboard?tab=stock`} className="text-zinc-500 hover:text-primary transition-colors text-sm">Gestión de Stock</Link>
              </>
            )}
          </div>
        )}

        <div className="flex items-center space-x-8 shrink-0">
          {!isAdmin && !isShop && (
            <>
              <Link to="/tiendas" className="text-sm text-zinc-600 hover:text-primary transition-colors">Tiendas</Link>
              <Link to="/carrito" className="relative p-2 text-zinc-600 hover:text-primary transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {cart.length}
                  </span>
                )}
              </Link>
            </>
          )}

          {userProfile ? (
            <button 
              onClick={() => signOut(auth)}
              className="text-zinc-500 hover:text-red-500 transition-colors text-sm"
            >
              Cerrar Sesión
            </button>
          ) : (
            <Link to="/auth" className="btn-primary py-1.5 px-6 rounded-full text-sm">Entrar</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const ProductCard = ({ product, shopName, hideAddToCart = false }: { product: Product, shopName: string, hideAddToCart?: boolean }) => {
  const { addToCart } = useCart();
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="card-base group"
    >
      <div className="aspect-square bg-zinc-100 overflow-hidden relative">
        <img 
          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`} 
          alt={product.name} 
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2">
          <span className="bg-white/90 backdrop-blur-sm text-zinc-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{shopName}</p>
        <h4 className="font-semibold text-zinc-900 mb-1">{product.name}</h4>
        <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">{product.description}</p>
        {!hideAddToCart && (
          <button 
            onClick={() => addToCart(product, shopName)}
            className="w-full btn-primary text-xs flex items-center justify-center space-x-2"
          >
            <Plus className="h-3 w-3" />
            <span>Añadir al Carrito</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

// --- Pages ---

const LandingPage = () => {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <section className="px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
        >
          <Sparkles className="h-4 w-4" />
          <span>Digitaliza tu comercio local</span>
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black text-primary leading-[0.9] mb-8 tracking-tighter">
          LA REVOLUCIÓN DEL <br />
          <span className="text-zinc-900 border-b-8 border-accent">COMERCIO ONLINE</span>
        </h1>
        <p className="text-xl text-zinc-500 max-w-2xl mb-10 leading-relaxed font-medium">
          Conectamos a las personas con sus tiendas locales favoritas. Compra de múltiples comercios en un solo pedido y apoya la economía de tu barrio.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/tiendas" className="btn-primary px-10 py-4 rounded-2xl text-lg flex items-center space-x-3 shadow-xl shadow-primary/20">
            <span>Explorar Tiendas</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link to="/auth" className="bg-white border-2 border-zinc-200 px-10 py-4 rounded-2xl text-lg font-bold text-zinc-700 hover:bg-zinc-50 transition-all">
            Soy Comerciante
          </Link>
        </div>
      </section>

      {/* Featured Grid */}
      <section className="bg-white py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Tiendas Cercanas</h2>
              <p className="text-zinc-500">Descubre los tesoros de tu vecindario</p>
            </div>
            <Link to="/tiendas" className="text-primary font-bold text-sm hover:underline flex items-center space-x-1">
              <span>Ver todas</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-base p-8 hover:border-primary transition-colors cursor-pointer group">
                <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Store className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Tienda de Ejemplo {i}</h3>
                <p className="text-zinc-500 text-sm mb-4">Especialistas en productos frescos y artesanales de la mejor calidad local.</p>
                <div className="inline-flex py-1 px-3 bg-zinc-100 rounded-full text-xs font-bold text-zinc-600">Alimentación</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const AuthPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName || "Usuario",
          role: "customer"
        });
      }
    } catch (e: any) {
      setError("Error con Google login: " + e.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegistering) {
        const { createUserWithEmailAndPassword } = await import("firebase/auth");
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), {
          email: email,
          name: name,
          role: "customer" // Hardcoded as per instructions
        });
      } else {
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      setError("Error: " + e.message);
    }
  };

  const bootstrapUsers = async () => {
    setError("");
    try {
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = await import("firebase/auth");
      
      const usersToCreate = [
        { email: "admin@admin.com", pass: "123456789", name: "Administrador", role: "admin" },
        { email: "gerente@gerente.com", pass: "123456789", name: "Gerente", role: "shop" }
      ];

      for (const u of usersToCreate) {
        try {
          const res = await createUserWithEmailAndPassword(auth, u.email, u.pass);
          await setDoc(doc(db, COLLECTIONS.USERS, res.user.uid), {
            email: u.email,
            name: u.name,
            role: u.role
          });
          await signOut(auth); // Sign out after creating so we can create the next one
        } catch (e: any) {
          if (e.code === "auth/email-already-in-use") {
            // If exists, at least try to update the role in Firestore if needed
            console.log(`${u.email} already exists`);
          } else {
            throw e;
          }
        }
      }
      alert("Usuarios creados con éxito. Ahora puedes iniciar sesión.");
    } catch (e: any) {
      if (e.code === "auth/operation-not-allowed") {
        setError("ERROR: Debes activar 'Email/Password' en tu Firebase Console (Authentication > Sign-in method).");
      } else {
        setError("Error en bootstrap: " + e.message);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-base max-w-md w-full p-8 shadow-2xl border-zinc-800 bg-zinc-900"
      >
        <div className="bg-primary/10 h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Store className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-black text-center text-white mb-2 tracking-tight">
          {isRegistering ? "Crea tu cuenta" : "Bienvenido"}
        </h2>
        <p className="text-zinc-500 text-center mb-8 text-sm">
          {isRegistering ? "Regístrate ahora como cliente local." : "Inicia sesión para gestionar tus compras locales."}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Nombre Completo</label>
              <input 
                required type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full p-3.5 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Email</label>
            <input 
              required type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-3.5 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Contraseña</label>
            <input 
              required type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full p-3.5 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button type="submit" className="w-full btn-primary py-4 rounded-xl shadow-xl shadow-primary/20 text-lg font-black uppercase tracking-tighter mt-2">
            {isRegistering ? "Unirse a Localink" : "Entrar"}
          </button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-zinc-900 px-4 text-zinc-600">O continúa con</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="mt-6 w-full flex items-center justify-center space-x-3 bg-zinc-800 border border-zinc-700 text-white py-3.5 rounded-xl font-bold hover:bg-zinc-700 transition-all active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" className="h-5 w-5" alt="G" referrerPolicy="no-referrer" />
          <span>Google</span>
        </button>

        <p className="mt-8 text-center text-sm text-zinc-500">
          {isRegistering ? "¿Ya tienes cuenta?" : "¿Nuevo aquí?"}{" "}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-primary font-bold hover:underline"
          >
            {isRegistering ? "Inicia sesión" : "Crea una cuenta de Cliente"}
          </button>
        </p>

        {/* Botón temporal de seeding MUY VISIBLE para el usuario */}
        <button 
          onClick={bootstrapUsers}
          className="mt-12 w-full p-4 bg-green-600 text-white rounded-xl font-black uppercase tracking-tighter shadow-lg shadow-green-500/20 hover:bg-green-500 transition-all active:scale-95"
        >
          🚀 CREAR USUARIOS DE PRUEBA (ADMIN Y GERENTE)
        </button>
      </motion.div>
    </div>
  );
};

const AdminPage = () => {
  const [users, setUsers] = useState<LocalinkUser[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isEditingUser, setIsEditingUser] = useState<LocalinkUser | null>(null);
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [isModifyingShop, setIsModifyingShop] = useState<Shop | null>(null);
  
  const [shopName, setShopName] = useState("");
  const [shopImage, setShopImage] = useState("");

  const searchParams = new URLSearchParams(useLocation().search);
  const activeTab = searchParams.get("tab") || "shops";

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (s) => {
      setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() } as LocalinkUser)));
    });
    const unsubShops = onSnapshot(collection(db, COLLECTIONS.SHOPS), (s) => {
      setShops(s.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });
    return () => {
      unsubUsers();
      unsubShops();
    };
  }, []);

  const updateUserRole = async (uid: string, newRole: string, shopId?: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        role: newRole,
        shopId: shopId || null
      });
      setIsEditingUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  const saveShop = async () => {
    if (!shopName || !shopImage) {
      alert("El nombre de la tienda y el logotipo son obligatorios.");
      return;
    }
    try {
      if (isModifyingShop) {
        await updateDoc(doc(db, COLLECTIONS.SHOPS, isModifyingShop.id), {
          name: shopName,
          imageUrl: shopImage
        });
      } else {
        await addDoc(collection(db, COLLECTIONS.SHOPS), {
          name: shopName,
          description: "Tienda local registrada en Localink.",
          imageUrl: shopImage
        });
      }
      resetShopForm();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteShop = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta tienda?")) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.SHOPS, id));
        setSelectedShopId(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteUser = async (uid: string) => {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const resetShopForm = () => {
    setShopName("");
    setShopImage("");
    setIsAddingShop(false);
    setIsModifyingShop(null);
    setSelectedShopId(null);
  };

  const openModifyShop = (shop: Shop) => {
    setShopName(shop.name);
    setShopImage((shop as any).imageUrl || "");
    setIsModifyingShop(shop);
  };

  return (
    <div 
      className={cn(
        "min-h-[calc(100vh-73px)] relative flex flex-col",
        activeTab === "shops" ? "bg-cover bg-center bg-no-repeat" : "bg-white"
      )}
      style={activeTab === "shops" ? { backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000")' } : {}}
    >
      {/* Overlay for shops tab */}
      {activeTab === "shops" && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />}

      <div className="relative z-10 flex-1 flex flex-col items-center">
        {activeTab === "shops" ? (
          <div className="w-full max-w-7xl px-4 py-16 flex flex-col items-center flex-1">
            <h1 className="text-6xl font-medium text-zinc-900 mb-20">Tiendas</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 w-full mb-32 max-w-6xl">
              {shops.map(s => (
                <motion.div 
                  key={s.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedShopId(s.id === selectedShopId ? null : s.id)}
                  className={cn(
                    "bg-white rounded-xl shadow-lg transition-all flex flex-col items-center justify-center p-8 min-h-[220px] cursor-pointer border-4",
                    selectedShopId === s.id ? "border-primary shadow-2xl" : "border-transparent hover:shadow-xl"
                  )}
                >
                  <div className="flex-1 flex items-center justify-center w-full">
                    <img 
                      src={s.imageUrl || `https://picsum.photos/seed/${s.name}/400/200`} 
                      alt={s.name} 
                      className="max-h-20 max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-zinc-700 text-lg font-medium mt-6">{s.name}</p>
                </motion.div>
              ))}
              {shops.length === 0 && (
                <div className="col-span-full py-20 text-center text-zinc-600 font-bold text-2xl bg-white/80 backdrop-blur rounded-3xl p-12">
                  No hay tiendas registradas.
                </div>
              )}
            </div>

            {/* Bottom Panel Buttons */}
            <div className="fixed bottom-12 flex space-x-6 items-center px-8 py-3 bg-zinc-900/10 backdrop-blur-md rounded-2xl">
              <button 
                onClick={() => setIsAddingShop(true)}
                className="px-10 py-4 bg-zinc-800 text-white font-bold rounded-lg hover:bg-zinc-700 transition-all shadow-xl active:scale-95"
              >
                Añadir Tienda
              </button>
              <button 
                onClick={() => {
                  const shop = shops.find(s => s.id === selectedShopId);
                  if (shop) openModifyShop(shop);
                }}
                disabled={!selectedShopId}
                className={cn(
                  "px-10 py-4 font-bold rounded-lg transition-all shadow-xl active:scale-95 text-opacity-90",
                  selectedShopId ? "bg-slate-500 text-white hover:bg-slate-400" : "bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none"
                )}
              >
                Modificar Tienda
              </button>
              <button 
                onClick={() => {
                  if (selectedShopId) deleteShop(selectedShopId);
                }}
                disabled={!selectedShopId}
                className={cn(
                  "px-10 py-4 font-bold rounded-lg transition-all shadow-xl active:scale-95 text-opacity-90",
                  selectedShopId ? "bg-slate-500 text-white hover:bg-red-600" : "bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none"
                )}
              >
                Eliminar Tienda
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl px-4 py-12 md:px-12">
            <header className="mb-12">
              <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Gestión de Usuarios</h1>
              <p className="text-zinc-500 font-medium tracking-tight">Control total sobre roles y accesos.</p>
            </header>

            <div className="card-base bg-white shadow-xl border-zinc-200 overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Rol</th>
                      <th className="px-6 py-4">Tienda Asignada</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {users.map(u => (
                      <tr key={u.uid} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-500 text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-zinc-900">{u.name}</p>
                              <p className="text-xs text-zinc-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest",
                            u.role === "admin" ? "bg-red-100 text-red-600" : 
                            u.role === "shop" ? "bg-amber-100 text-amber-600" : 
                            "bg-zinc-100 text-zinc-600"
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {u.role === "shop" ? (
                            shops.find(s => s.id === u.shopId)?.name || "⚠️ Sin asignar"
                          ) : "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => setIsEditingUser(u)}
                              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-primary transition-colors"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteUser(u.uid)}
                              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales: El resto del código se mantiene igual... */}
      <AnimatePresence>
        {isEditingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditingUser(null)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-2">Editar Usuario</h2>
              <p className="text-zinc-500 text-sm mb-6">Cambia el rol y asignación para <strong>{isEditingUser.name}</strong></p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Nuevo Rol</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["customer", "shop", "admin"].map(r => (
                      <button 
                        key={r}
                        onClick={() => setIsEditingUser({...isEditingUser, role: r as any})}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold border-2 transition-all",
                          isEditingUser.role === r 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-zinc-50 border-zinc-100 text-zinc-500 hover:border-zinc-200"
                        )}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {isEditingUser.role === "shop" && (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Asignar Tienda</label>
                    <select 
                      value={isEditingUser.shopId || ""} 
                      onChange={e => setIsEditingUser({...isEditingUser, shopId: e.target.value})}
                      className="w-full p-3 bg-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                    >
                      <option value="">Selecciona una tienda...</option>
                      {shops.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button onClick={() => setIsEditingUser(null)} className="flex-1 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl">Cancelar</button>
                  <button 
                    onClick={() => updateUserRole(isEditingUser.uid, isEditingUser.role, isEditingUser.shopId)}
                    className="flex-1 btn-primary py-3 rounded-xl shadow-lg shadow-primary/20"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isAddingShop || isModifyingShop) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={resetShopForm}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">{isModifyingShop ? "Modificar Tienda" : "Registrar Tienda"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Nombre de la Tienda *</label>
                  <input 
                    type="text" value={shopName} onChange={e => setShopName(e.target.value)}
                    placeholder="Ej: Panadería El Sol"
                    className="w-full p-3.5 bg-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">URL del Logo *</label>
                  <input 
                    type="text" value={shopImage} onChange={e => setShopImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-3.5 bg-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button onClick={resetShopForm} className="flex-1 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl">Cancelar</button>
                  <button onClick={saveShop} className="flex-1 btn-primary py-3 rounded-xl">
                    {isModifyingShop ? "Guardar" : "Crear"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShopDashboard = () => {
  const { slug } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [genDesc, setGenDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const searchParams = new URLSearchParams(useLocation().search);
  const activeTab = searchParams.get("tab") || "home";

  useEffect(() => {
    if (!slug) return;
    const unsubShop = onSnapshot(doc(db, COLLECTIONS.SHOPS, slug), (s) => {
      if (s.exists()) setShop({ id: s.id, ...s.data() } as Shop);
    });
    const q = query(collection(db, COLLECTIONS.PRODUCTS), where("shopId", "==", slug));
    const unsubProducts = onSnapshot(q, (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    return () => {
      unsubShop();
      unsubProducts();
    };
  }, [slug]);

  const handleGenAI = async () => {
    if (!newTitle) return;
    setIsGenerating(true);
    const desc = await generateProductDescription(newTitle);
    setGenDesc(desc);
    setIsGenerating(false);
  };

  const saveProduct = async () => {
    if (!newTitle || !newPrice || !newImageUrl) {
      alert("Faltan campos obligatorios para el producto.");
      return;
    }
    const productData = {
      name: newTitle,
      description: genDesc,
      price: parseFloat(newPrice),
      stock: parseInt(newStock) || 0,
      imageUrl: newImageUrl,
      shopId: slug
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, COLLECTIONS.PRODUCTS, editingProduct.id), productData);
      } else {
        await addDoc(collection(db, COLLECTIONS.PRODUCTS), productData);
      }
      setIsAdding(false);
      setEditingProduct(null);
      setNewTitle("");
      setNewPrice("");
      setNewStock("");
      setNewImageUrl("");
      setGenDesc("");
    } catch (e) {
      console.error(e);
    }
  };

  const updateStock = async (id: string, newStockVal: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), { stock: parseInt(newStockVal) || 0 });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, id);
      await deleteDoc(productRef);
      setProductToDelete(null);
    } catch (e: any) {
      console.error("Error al eliminar producto:", e);
      alert("Error al eliminar el producto: " + e.message);
    }
  };

  return (
    <div 
      className={cn(
        "min-h-[calc(100vh-73px)] relative flex flex-col",
        activeTab === "home" ? "bg-cover bg-center bg-no-repeat" : "bg-white"
      )}
      style={activeTab === "home" ? { backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000")' } : {}}
    >
      {activeTab === "home" && <div className="absolute inset-0 bg-white/50 backdrop-blur-[4px]" />}

      <div className="relative z-10 flex-1 flex flex-col pt-12 items-center px-4 md:px-12">
        {activeTab === "home" && shop && (
          <div className="w-full max-w-7xl flex flex-col items-center">
            {/* Logo Shop centered */}
            <div className="bg-white/80 backdrop-blur p-6 rounded-3xl shadow-xl mb-12 border border-white">
              <img src={shop.imageUrl} alt={shop.name} className="max-h-24 max-w-full object-contain" referrerPolicy="no-referrer" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
              {products.map(p => (
                <ProductCard key={p.id} product={p} shopName={shop.name} hideAddToCart />
              ))}
              {products.length === 0 && (
                <div className="col-span-full py-20 text-center text-zinc-500 font-bold bg-white/20 backdrop-blur border border-white/50 rounded-3xl">
                  No hay productos registrados en esta tienda.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="w-full max-w-7xl">
            <header className="mb-12 flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Gestión de Productos</h1>
                <p className="text-zinc-500 font-medium tracking-tight">Administra el catálogo de tu tienda.</p>
              </div>
              <button 
                onClick={() => setIsAdding(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Producto</span>
              </button>
            </header>

            <div className="card-base bg-white shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 flex items-center space-x-3">
                        <img src={p.imageUrl} className="h-10 w-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <span className="font-bold text-zinc-900">{p.name}</span>
                      </td>
                      <td className="px-6 py-4 font-bold">{formatPrice(p.price)}</td>
                      <td className="px-6 py-4">{p.stock} uds</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => {
                              setEditingProduct(p);
                              setNewTitle(p.name);
                              setNewImageUrl(p.imageUrl || "");
                              setNewPrice(p.price.toString());
                              setNewStock(p.stock.toString());
                              setGenDesc(p.description);
                              setIsAdding(true);
                            }}
                            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-primary transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setProductToDelete(p.id)}
                            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "stock" && (
          <div className="w-full max-w-7xl">
            <header className="mb-12">
              <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Gestión de Stock</h1>
              <p className="text-zinc-500 font-medium tracking-tight">Actualiza las existencias de tus productos.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="card-base p-6 bg-white shadow-xl flex items-center space-x-4">
                  <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <p className="font-bold text-zinc-900 mb-2">{p.name}</p>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="number" 
                        value={p.stock}
                        onChange={(e) => updateStock(p.id, e.target.value)}
                        className="w-20 p-2 bg-zinc-100 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="text-xs font-bold text-zinc-400 uppercase">Unidades</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "schedules" && (
          <div className="w-full max-w-7xl">
            <header className="mb-12">
              <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Gestión de Horarios</h1>
              <p className="text-zinc-500 font-medium tracking-tight">Organiza los turnos de tus empleados.</p>
            </header>
            
            <div className="bg-white/80 backdrop-blur rounded-3xl p-12 text-center border-2 border-dashed border-zinc-200">
              <Calendar className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-400">Próximamente</h3>
              <p className="text-zinc-500">Módulo de planificación de turnos en desarrollo.</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingProduct(null); }}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Nombre *</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-3 bg-zinc-100 rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Logo/Imagen URL *</label>
                  <input type="text" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} className="w-full p-3 bg-zinc-100 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Precio *</label>
                    <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full p-3 bg-zinc-100 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Stock inicial</label>
                    <input type="number" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full p-3 bg-zinc-100 rounded-xl" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Descripción</label>
                    <button onClick={handleGenAI} disabled={isGenerating || !newTitle} className="text-[10px] font-bold text-primary flex items-center space-x-1 hover:underline disabled:opacity-50">
                      <Sparkles className="h-3 w-3" />
                      <span>{isGenerating ? "Generando..." : "Generar con IA"}</span>
                    </button>
                  </div>
                  <textarea value={genDesc} onChange={e => setGenDesc(e.target.value)} className="w-full p-3 bg-zinc-100 rounded-xl h-24" />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="flex-1 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl">Cancelar</button>
                  <button onClick={saveProduct} className="flex-1 btn-primary py-3 rounded-xl shadow-lg shadow-primary/20">Guardar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">¿Eliminar producto?</h2>
              <p className="text-zinc-500 text-sm mb-8">Esta acción no se puede deshacer. El producto desaparecerá del catálogo.</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (productToDelete) deleteProduct(productToDelete);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 py-3 font-bold text-white rounded-xl shadow-lg shadow-red-200 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold">Carrito de Compras</h1>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center">
          <div className="bg-zinc-100 h-24 w-24 rounded-full flex items-center justify-center mb-6 text-zinc-300">
            <ShoppingCart className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold text-zinc-400 mb-2">Tu carrito está vacío</h2>
          <Link to="/tiendas" className="text-primary font-bold hover:underline">Ir a comprar algo local</Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card-base p-6 space-y-6">
            {cart.map(item => (
              <div key={item.id} className="flex items-center space-x-4 pb-6 border-b border-zinc-100 last:border-0 last:pb-0">
                <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} className="h-20 w-20 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{item.shopName}</p>
                  <h4 className="font-bold truncate">{item.name}</h4>
                  <p className="text-sm font-bold text-zinc-900">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center space-x-3 bg-zinc-100 p-1.5 rounded-lg">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Trash2 className="h-4 w-4 text-zinc-500" /></button>
                  <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="card-base p-8 bg-zinc-900 text-white flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-1">Total del pedido</p>
              <h3 className="text-4xl font-black">{formatPrice(total)}</h3>
            </div>
            <button className="bg-primary hover:bg-primary/90 text-white font-black text-xl px-12 py-5 rounded-2xl shadow-2xl shadow-primary/40 transition-all active:scale-95 uppercase tracking-tighter">
              Pagar Ahora
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ShopList = () => {
  const navigate = useNavigate();
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Directorio de Tiendas</h1>
        <div className="max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o tipo de producto..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1,2,3,4,5,6].map(i => (
          <motion.div 
            key={i} 
            whileHover={{ y: -8 }}
            onClick={() => navigate(`/tienda/ejemplo-${i}`)}
            className="card-base cursor-pointer group"
          >
            <div className="h-48 bg-zinc-200 relative overflow-hidden">
               <img src={`https://picsum.photos/seed/shop${i}/800/400`} className="h-full w-full object-cover group-hover:scale-105 transition-transform" alt="" referrerPolicy="no-referrer" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
               <div className="absolute bottom-4 left-4">
                 <div className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded mb-1 uppercase tracking-widest inline-block">Alimentación</div>
                 <h3 className="text-xl font-bold text-white">Local {i} Market</h3>
               </div>
            </div>
            <div className="p-6">
              <p className="text-zinc-500 text-sm mb-4 line-clamp-2">Tu destino local para productos artesanales, frescos y de origen ético.</p>
              <div className="flex items-center space-x-1 text-primary font-bold text-sm">
                <span>Ver catálogo</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

function AppContent() {
  const [userProfile, setUserProfile] = useState<LocalinkUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uRef = doc(db, COLLECTIONS.USERS, user.uid);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          const profile = { uid: user.uid, ...uSnap.data() } as LocalinkUser;
          setUserProfile(profile);
          
          // Redirección por rol si entra a la raíz
          if (profile.role === "admin" && location.pathname === "/") {
            navigate("/admin");
          } else if (profile.role === "shop" && location.pathname === "/" && profile.shopId) {
            navigate(`/tienda/${profile.shopId}/dashboard`);
          }
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate, location.pathname]);

  if (authLoading) return null;

  // Si no hay usuario, mostrar exclusivamente la pantalla de Auth (Login/Registro)
  if (!userProfile) {
    return <AuthPage />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userProfile={userProfile} />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tiendas" element={<ShopList />} />
          <Route path="/carrito" element={<CartPage />} />
          
          {/* Protección de rutas por Rol */}
          {userProfile.role === "admin" && (
            <Route path="/admin" element={<AdminPage />} />
          )}
          
          {userProfile.role === "shop" && (
            <Route path="/tienda/:slug/dashboard" element={<ShopDashboard />} />
          )}
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <footer className="bg-zinc-900 text-zinc-500 py-12 px-4 border-t border-zinc-800">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-bold text-zinc-300">Localink</span>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest">© 2026 Localink - La Revolución Del Comercio Online</p>
          <div className="flex space-x-6 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </BrowserRouter>
  );
}
