// إدارة بائعين وCRUD منتجات (localStorage-based). لا تستخدم في إنتاج بدون خادم.
const VENDORS_KEY = 'sphinxfy_vendors_v1';
const PRODUCTS_KEY = 'sphinxfy_products_v1';

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authMsg = document.getElementById('auth-msg');
const switchBtn = document.getElementById('switch-register');
const dashboard = document.getElementById('dashboard');
const authSection = document.getElementById('auth-section');
const vendorNameEl = document.getElementById('vendor-name');
const logoutBtn = document.getElementById('logout');

const productForm = document.getElementById('product-form');
const myProductsEl = document.getElementById('my-products');
const clearFormBtn = document.getElementById('clear-form');

let isRegister = false;
let currentVendor = null;

// utils
function readJSON(key){ return JSON.parse(localStorage.getItem(key) || '[]'); }
function writeJSON(key, v){ localStorage.setItem(key, JSON.stringify(v)); }
function findVendor(name){ return readJSON(VENDORS_KEY).find(v=>v.name===name); }

// auth
switchBtn.addEventListener('click', ()=>{
  isRegister = !isRegister;
  authTitle.textContent = isRegister ? 'تسجيل بائع جديد' : 'تسجيل دخول بائع';
  document.getElementById('auth-submit').textContent = isRegister ? 'تسجيل' : 'دخول';
  authMsg.textContent = '';
});

authForm.addEventListener('submit', e=>{
  e.preventDefault();
  const vendor = authForm.vendor.value.trim();
  const pw = authForm.password.value;
  if(!vendor || !pw) return;
  const vendors = readJSON(VENDORS_KEY);
  const existing = vendors.find(v=>v.name===vendor);
  if(isRegister){
    if(existing){ authMsg.textContent = 'اسم البائع موجود مسبقًا.'; return; }
    vendors.push({name:vendor,password:pw});
    writeJSON(VENDORS_KEY, vendors);
    authMsg.textContent = 'تم إنشاء الحساب. يمكنك الآن تسجيل الدخول.';
    isRegister = false; authTitle.textContent = 'تسجيل دخول بائع'; document.getElementById('auth-submit').textContent = 'دخول';
    authForm.reset();
    return;
  } else {
    if(!existing || existing.password !== pw){ authMsg.textContent = 'اسم أو كلمة مرور غير صحيحة.'; return; }
    currentVendor = existing.name;
    authSection.style.display = 'none';
    dashboard.style.display = 'block';
    vendorNameEl.textContent = currentVendor;
    renderMyProducts();
  }
});

logoutBtn.addEventListener('click', ()=>{
  currentVendor = null;
  dashboard.style.display = 'none';
  authSection.style.display = 'block';
  authForm.reset();
});

function allProducts(){ return readJSON(PRODUCTS_KEY); }
function saveProducts(list){ writeJSON(PRODUCTS_KEY, list); }

productForm.addEventListener('submit', e=>{
  e.preventDefault();
  if(!currentVendor) return alert('سجل دخول أولا');
  const idField = productForm.id.value;
  const title = productForm.title.value.trim();
  const price = parseFloat(productForm.price.value) || 0;
  const img = productForm.img.value.trim() || 'https://via.placeholder.com/400x300';
  let products = allProducts();
  if(idField){
    products = products.map(p=> p.id===idField ? {...p,title,price,img,vendor:currentVendor} : p);
  } else {
    const id = 'p' + Date.now();
    products.push({id,title,price,img,vendor:currentVendor});
  }
  saveProducts(products);
  productForm.reset();
  renderMyProducts();
});

function renderMyProducts(){
  const products = allProducts().filter(p=>p.vendor===currentVendor);
  myProductsEl.innerHTML = '';
  if(products.length === 0){ myProductsEl.textContent = 'لا توجد منتجات بعد.'; return; }
  products.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'prod';
    div.innerHTML = `
      <div style="display:flex;gap:.75rem;align-items:center">
        <img src="${p.img}" alt="${p.title}" />
        <div>
          <strong>${p.title}</strong><br/>
          <small>${p.price} EGP</small>
        </div>
      </div>
      <div style="display:flex;gap:.5rem">
        <button data-edit="${p.id}" class="btn">تعديل</button>
        <button data-del="${p.id}">حذف</button>
      </div>`;
    myProductsEl.appendChild(div);
  });
  myProductsEl.querySelectorAll('[data-edit]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = b.dataset.edit;
      const p = allProducts().find(x=>x.id===id);
      productForm.id.value = p.id;
      productForm.title.value = p.title;
      productForm.price.value = p.price;
      productForm.img.value = p.img;
    });
  });
  myProductsEl.querySelectorAll('[data-del]').forEach(b=>{
    b.addEventListener('click', ()=>{
      if(!confirm('حذف المنتج؟')) return;
      const id = b.dataset.del;
      saveProducts(allProducts().filter(x=>x.id!==id));
      renderMyProducts();
    });
  });
}

clearFormBtn.addEventListener('click', ()=> productForm.reset());
