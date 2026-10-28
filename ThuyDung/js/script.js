/* ============================================================
   PORTFOLIO - Đặng Ngọc Thùy Dung
   JavaScript thuần (DOM + Event), không dùng thư viện ngoài.
   Mục lục:
    1. Menu mobile                 8. Tabs dự án (danh sách + khung xem)
    2. Dark / Light mode           9. Lightbox phóng to ảnh
    3. Tiến độ cuộn + menu active 10. Form liên hệ + kiểm tra dữ liệu
    4. Hiệu ứng gõ chữ            11. AES-256 Playground (Web Crypto)
    5. Hiện dần khi cuộn          12. Nút lên đầu trang, năm footer
    6. Đếm số thống kê
    7. Accordion mục tiêu + bộ lọc kỹ năng
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $all(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

  /* ---------- 1. MENU MOBILE ---------- */
  var menuToggle = $("#menu-toggle");
  var navbar = $("#navbar");
  var navLinks = $all(".nav-link");

  function setMenu(open) {
    navbar.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Đóng menu điều hướng" : "Mở menu điều hướng");
    menuToggle.textContent = open ? "Đóng" : "Menu";
  }
  menuToggle.addEventListener("click", function () { setMenu(!navbar.classList.contains("is-open")); });
  navLinks.forEach(function (l) { l.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* ---------- 2. DARK / LIGHT MODE ---------- */
  var THEME_KEY = "dung-portfolio-theme-v2";
  var themeButtons = $all("[data-theme-toggle]");
  var switchLabel = $(".switch-label");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var dark = theme === "dark";
    themeButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(dark)); });
    if (switchLabel) switchLabel.textContent = dark ? "Neon tím" : "Neon xanh";
  }
  try {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") applyTheme(saved);
  } catch (err) { /* localStorage bị chặn: bỏ qua */ }

  themeButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* bỏ qua */ }
    });
  });

  /* ---------- 3. TIẾN ĐỘ CUỘN + MENU ACTIVE ---------- */
  var progress = $("#progress");
  var backToTop = $("#back-to-top");
  var sections = $all("main section[id]").filter(function (s) {
    return navLinks.some(function (l) { return l.getAttribute("href") === "#" + s.id; });
  });
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    backToTop.classList.toggle("show", y > 600);

    var current = sections[0].id;
    sections.forEach(function (s) { if (y >= s.offsetTop - 160) current = s.id; });
    navLinks.forEach(function (l) {
      var active = l.getAttribute("href") === "#" + current;
      l.classList.toggle("is-active", active);
      if (active) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
    });
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- 4. HIỆU ỨNG GÕ CHỮ ---------- */
  var typed = $("#typed");
  if (typed && !reduceMotion) {
    var roles = typed.getAttribute("data-roles").split("|");
    var ri = 0, ci = roles[0].length, deleting = true;
    (function tick() {
      var text = roles[ri];
      typed.textContent = text.slice(0, ci);
      var delay = deleting ? 35 : 80;
      if (!deleting && ci === text.length) { deleting = true; delay = 1800; }
      else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 350; }
      else { ci += deleting ? -1 : 1; }
      window.setTimeout(tick, delay);
    })();
  }

  /* ---------- 5. HIỆN DẦN KHI CUỘN ---------- */
  var revealItems = $all(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
          window.setTimeout(function () { entry.target.style.transitionDelay = ""; }, 1000);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + "ms";
      io.observe(el);
    });
  } else {
    revealItems.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- 6. ĐẾM SỐ THỐNG KÊ ---------- */
  $all("[data-count]").forEach(function (el) {
    var target = Number(el.getAttribute("data-count"));
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    if (reduceMotion) { el.textContent = pad(target); return; }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / 1200, 1);
      el.textContent = pad(Math.round(target * p));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  });

  /* ---------- 7. ACCORDION MỤC TIÊU + BỘ LỌC KỸ NĂNG ---------- */
  // Accordion: chỉ mở một mục tại một thời điểm
  var accItems = $all("#goals-accordion details");
  accItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) accItems.forEach(function (o) { if (o !== item) o.open = false; });
    });
  });

  // Bộ lọc kỹ năng
  var filterGroup = $('[data-filter-group="skills"]');
  var skillItems = $all("#skills-grid [data-category]");
  if (filterGroup) {
    var tabs = $all(".tab", filterGroup);
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var filter = tab.getAttribute("data-filter");
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-pressed", String(on));
        });
        skillItems.forEach(function (item) {
          var match = filter === "all" || item.getAttribute("data-category").split(" ").indexOf(filter) !== -1;
          item.hidden = !match;
          if (match) {
            item.classList.add("in-view");
            item.classList.remove("pop");
            void item.offsetWidth; // khởi động lại animation
            item.classList.add("pop");
          }
        });
      });
    });
  }

  /* ---------- 8. TABS DỰ ÁN ---------- */
  var projTabs = $all(".proj-tab");
  var projPanels = $all(".proj-panel");

  function selectProject(index, focus) {
    projTabs.forEach(function (t, i) {
      var on = i === index;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    projPanels.forEach(function (p, i) { p.hidden = i !== index; });
  }
  projTabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectProject(i, false); });
    tab.addEventListener("keydown", function (e) {
      var n = projTabs.length;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); selectProject((i + 1) % n, true); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); selectProject((i - 1 + n) % n, true); }
    });
  });

  /* ---------- 9. LIGHTBOX PHÓNG TO ẢNH ---------- */
  var lightbox = $("#lightbox");
  if (lightbox && typeof lightbox.showModal === "function") {
    $all(".zoom-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var img = $("img", btn);
        var panel = btn.closest(".proj-panel");
        $("#lightbox-img").src = img.getAttribute("src");
        $("#lightbox-img").alt = img.getAttribute("alt");
        $("#lightbox-title").textContent = $("h3", panel).textContent;
        lightbox.showModal();
      });
    });
    $("#lightbox-close").addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.close(); });
  } else {
    $all(".zoom-btn").forEach(function (b) { b.style.cursor = "default"; });
  }

  /* ---------- 10. FORM LIÊN HỆ + KIỂM TRA DỮ LIỆU ---------- */
  var form = $("#contact-form");
  var status = $("#form-status");
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var nameField = $("#name"), emailField = $("#email"), messageField = $("#message");

  function setError(field, message) {
    field.closest(".field").classList.toggle("has-error", Boolean(message));
    $("#error-" + field.id).textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }
  function validateName(f) {
    var v = f.value.trim();
    if (!v) return setError(f, "Vui lòng nhập họ tên của bạn.");
    if (v.length < 2) return setError(f, "Họ tên phải có ít nhất 2 ký tự.");
    return setError(f, "");
  }
  function validateEmail(f) {
    var v = f.value.trim();
    if (!v) return setError(f, "Vui lòng nhập email của bạn.");
    if (!emailPattern.test(v)) return setError(f, "Email không hợp lệ. Ví dụ: ten@email.com");
    return setError(f, "");
  }
  function validateMessage(f) {
    var v = f.value.trim();
    if (!v) return setError(f, "Vui lòng nhập nội dung lời nhắn.");
    if (v.length < 10) return setError(f, "Nội dung quá ngắn (tối thiểu 10 ký tự).");
    return setError(f, "");
  }
  [[nameField, validateName], [emailField, validateEmail], [messageField, validateMessage]].forEach(function (p) {
    p[0].addEventListener("blur", function () { p[1](p[0]); });
    p[0].addEventListener("input", function () {
      if (p[0].closest(".field").classList.contains("has-error")) p[1](p[0]);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var ok = [validateName(nameField), validateEmail(emailField), validateMessage(messageField)].every(Boolean);
    status.className = "status show " + (ok ? "success" : "fail");

    if (ok) {
      // Chưa có backend: tạo liên kết mailto để gửi bằng ứng dụng email của người dùng
      var subject = encodeURIComponent("Liên hệ từ portfolio - " + nameField.value.trim());
      var body = encodeURIComponent(messageField.value.trim() + "\n\n" + nameField.value.trim() + " (" + emailField.value.trim() + ")");
      status.innerHTML = "Dữ liệu hợp lệ. Website chưa có máy chủ nên lời nhắn chưa tự gửi đi. " +
        '<a href="mailto:dangngocthuydung9191@gmail.com?subject=' + subject + "&body=" + body + '">Bấm vào đây để gửi bằng ứng dụng email của bạn</a>.';
    } else {
      status.textContent = "Vui lòng kiểm tra lại các ô báo lỗi bên trên.";
      var bad = [nameField, emailField, messageField].filter(function (f) { return f.getAttribute("aria-invalid") === "true"; })[0];
      if (bad) bad.focus();
    }
  });

  /* ---------- 11. AES-256 PLAYGROUND (Web Crypto API) ---------- */
  var btnEncrypt = $("#btn-encrypt");
  var btnDecrypt = $("#btn-decrypt");
  var demoText = $("#demo-text");
  var demoCipher = $("#demo-cipher");
  var demoPass = $("#demo-pass");
  var demoStatus = $("#demo-status");

  function demoMessage(text, ok) {
    demoStatus.className = "status mono show " + (ok ? "success" : "fail");
    demoStatus.textContent = text;
  }
  function toBase64(bytes) {
    var bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function fromBase64(str) {
    var bin = atob(str.trim());
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // PBKDF2 (SHA-256, 100.000 vòng) -> khóa AES-256
  function deriveKey(password, salt) {
    return crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]).then(function (m) {
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
        m, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }

  if (!window.crypto || !window.crypto.subtle) {
    btnEncrypt.disabled = btnDecrypt.disabled = true;
    demoMessage("Trình duyệt hiện tại không hỗ trợ Web Crypto (cần mở bằng https hoặc localhost).", false);
  } else {
    btnEncrypt.addEventListener("click", function () {
      var password = demoPass.value;
      if (!demoText.value.trim()) return demoMessage("Hãy nhập văn bản cần mã hóa.", false);
      if (!password) return demoMessage("Hãy nhập mật khẩu.", false);

      var salt = crypto.getRandomValues(new Uint8Array(16));
      var iv = crypto.getRandomValues(new Uint8Array(12));
      deriveKey(password, salt)
        .then(function (key) { return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(demoText.value)); })
        .then(function (buf) {
          var data = new Uint8Array(buf);
          var packed = new Uint8Array(salt.length + iv.length + data.length);
          packed.set(salt, 0); packed.set(iv, salt.length); packed.set(data, salt.length + iv.length);
          demoCipher.value = toBase64(packed);
          demoMessage("Đã mã hóa: salt(16) + iv(12) + bản mã, bằng AES-256-GCM.", true);
        })
        .catch(function () { demoMessage("Không thể mã hóa. Vui lòng thử lại.", false); });
    });

    btnDecrypt.addEventListener("click", function () {
      var password = demoPass.value;
      if (!demoCipher.value.trim()) return demoMessage("Hãy nhập bản mã (Base64) cần giải mã.", false);
      if (!password) return demoMessage("Hãy nhập mật khẩu.", false);

      var packed;
      try { packed = fromBase64(demoCipher.value); } catch (err) { return demoMessage("Bản mã không phải Base64 hợp lệ.", false); }
      if (packed.length < 29) return demoMessage("Bản mã quá ngắn hoặc bị thiếu dữ liệu.", false);

      deriveKey(password, packed.slice(0, 16))
        .then(function (key) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: packed.slice(16, 28) }, key, packed.slice(28)); })
        .then(function (buf) {
          demoText.value = new TextDecoder().decode(buf);
          demoMessage("Giải mã thành công, dữ liệu toàn vẹn.", true);
        })
        .catch(function () { demoMessage("Giải mã thất bại: sai mật khẩu hoặc bản mã đã bị thay đổi.", false); });
    });
  }

  /* ---------- 12. NÚT LÊN ĐẦU TRANG + NĂM FOOTER ---------- */
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  $("#year").textContent = new Date().getFullYear();
})();
