
// Autentifikatsiyani tekshirish
function checkAuth() {
  const currentUser = sessionStorage.getItem("currentUser")
  if (!currentUser) {
    window.location.href = "../../src/pages/login.html"
    return
  }
  return JSON.parse(currentUser)
}

// Telegram bot konfiguratsiyasi
const TELEGRAM_BOT_TOKEN = "7972518235:AAEIhLp-LVENoe5DCweerO8l-9oK5KFZyRw" // Bu yerga bot tokenini kiriting
const TELEGRAM_CHAT_ID = "-1002294610813" // Bu yerga chat ID ni kiriting

// Telegram orqali xabar yuborish
async function sendTelegramMessage(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram bot token yoki chat ID kiritilmagan!")
    return
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    )

    if (!response.ok) {
      throw new Error("Telegram xabari yuborilmadi")
    }
  } catch (error) {
    console.error("Telegram xabari yuborishda xatolik:", error)
  }
}

// Telegram orqali fayl yuborish
async function sendTelegramFile(file, caption) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram bot token yoki chat ID kiritilmagan!")
    return
  }

  try {
    const formData = new FormData()
    formData.append("chat_id", TELEGRAM_CHAT_ID)
    formData.append("document", file)
    formData.append("caption", caption)

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error("Telegram fayli yuborilmadi")
    }
  } catch (error) {
    console.error("Telegram fayl yuborishda xatolik:", error)
  }
}

// Joriy foydalanuvchini tekshirish
const currentUser = checkAuth()

// Agar foydalanuvchi oddiy user bo'lsa, tahrirlash tugmalarini yashirish
if (currentUser.role === "user") {
  document.querySelectorAll(".edit-buttons").forEach((button) => {
    button.style.display = "none"
  })
}

// Qarzlar ma'lumotlarini saqlash uchun
let qarzlar = JSON.parse(localStorage.getItem("qarzlar")) || []
let tahrirlanayotganId = null

// DOM elementlarini topib olish
const qarzForm = document.getElementById("qarzForm")
const qarzlarRoyxati = document.getElementById("qarzlarRoyxati")
const searchInput = document.getElementById("searchInput")
const totalCustomers = document.getElementById("totalCustomers")
const totalDebt = document.getElementById("totalDebt")
const overdueDebts = document.getElementById("overdueDebts")
const submitBtn = document.querySelector('button[type="submit"]')

// Input maydonlarini topib olish
const inputFields = {
  mijozIsmi: document.getElementById("mijozIsmi"),
  telefon: document.getElementById("telefon"),
  mahsulot: document.getElementById("mahsulot"),
  qarzMiqdori: document.getElementById("qarzMiqdori"),
  sana: document.getElementById("sana"),
  tolashMuddati: document.getElementById("tolashMuddati"),
}

// Mahsulot tanlash uchun maxsus funksiya
function handleProductSelection() {
  const mahsulotSelect = inputFields.mahsulot
  const customProductDiv = document.createElement("div")
  customProductDiv.id = "customProductDiv"
  customProductDiv.className = "form-group mt-2"
  customProductDiv.innerHTML = `
    <label class="block text-sm font-medium text-gray-700">
      <i class="fas fa-edit mr-2"></i>Boshqa mahsulot nomi
    </label>
    <input
      class="w-full p-2 rounded-full px-4"
      type="text"
      id="customProduct"
      placeholder="Mahsulot nomini kiriting"
    />
  `

  mahsulotSelect.addEventListener("change", function () {
    const existingCustomDiv = document.getElementById("customProductDiv")
    if (this.value === "Boshqa") {
      if (!existingCustomDiv) {
        this.parentNode.insertAdjacentElement("afterend", customProductDiv)
      }
    } else {
      if (existingCustomDiv) {
        existingCustomDiv.remove()
      }
    }
  })
}

// Formadagi ma'lumotlarni saqlash
function saveFormData() {
  const formData = {}
  for (let field in inputFields) {
    formData[field] = inputFields[field].value
  }
  localStorage.setItem("formData", JSON.stringify(formData))
}

// Formadagi ma'lumotlarni qayta tiklash
function restoreFormData() {
  const savedData = localStorage.getItem("formData")
  if (savedData) {
    const formData = JSON.parse(savedData)
    for (let field in formData) {
      if (inputFields[field]) {
        inputFields[field].value = formData[field]
      }
    }
  }
}

// Input maydonlari o'zgarganida ma'lumotlarni saqlash
for (let field in inputFields) {
  inputFields[field].addEventListener("input", saveFormData)
}

// Statistikani yangilash
function updateStats() {
  // Jami mijozlar (unique mijozlar soni)
  const uniqueCustomers = new Set(qarzlar.map((qarz) => qarz.mijozIsmi)).size
  totalCustomers.textContent = uniqueCustomers

  // Jami qarzlar summasi
  const totalDebtAmount = qarzlar
    .filter((qarz) => qarz.status === "To'lanmagan")
    .reduce((sum, qarz) => sum + qarz.qarzMiqdori, 0)
  totalDebt.textContent = totalDebtAmount.toLocaleString() + " so'm"

  // Muddati o'tgan qarzlar soni
  const today = new Date()
  const overdue = qarzlar.filter(
    (qarz) =>
      new Date(qarz.tolashMuddati) < today && qarz.status === "To'lanmagan"
  ).length
  overdueDebts.textContent = overdue
}

// Formani tozalash va tahrirlash rejimini o'chirish
function resetForm() {
  qarzForm.reset()
  localStorage.removeItem("formData")
  tahrirlanayotganId = null
  submitBtn.textContent = "Qarzni saqlash"
  submitBtn.classList.remove("bg-yellow-500", "hover:bg-yellow-600")
  submitBtn.classList.add("bg-blue-500", "hover:bg-blue-600")
}

// Qarzni tahrirlash uchun formani to'ldirish
function qarzniTahrirlash(id) {
  const qarz = qarzlar.find((q) => q.id === id)
  if (qarz) {
    tahrirlanayotganId = id

    // Form maydonlarini to'ldirish
    inputFields.mijozIsmi.value = qarz.mijozIsmi
    inputFields.telefon.value = qarz.telefon
    inputFields.mahsulot.value = qarz.mahsulot
    inputFields.qarzMiqdori.value = qarz.qarzMiqdori
    inputFields.sana.value = qarz.sana
    inputFields.tolashMuddati.value = qarz.tolashMuddati

    // Tugma matnini o'zgartirish
    submitBtn.textContent = "O'zgarishlarni saqlash"
    submitBtn.classList.remove("bg-blue-500", "hover:bg-blue-600")
    submitBtn.classList.add("bg-yellow-500", "hover:bg-yellow-600")

    // Formaga fokus qilish
    inputFields.mijozIsmi.focus()

    // Formaga scroll qilish
    qarzForm.scrollIntoView({ behavior: "smooth" })
  }
}

// Formani yuborish
qarzForm.addEventListener("submit", function (e) {
  e.preventDefault()

  // Forma ma'lumotlarini tekshirish
  if (
    !inputFields.mijozIsmi.value ||
    !inputFields.telefon.value ||
    !inputFields.mahsulot.value ||
    !inputFields.qarzMiqdori.value ||
    !inputFields.sana.value ||
    !inputFields.tolashMuddati.value
  ) {
    alert("Iltimos, barcha maydonlarni to'ldiring!")
    return
  }

  try {
    // Agar "Boshqa" tanlangan bo'lsa, custom input qiymatini olish
    const mahsulotValue =
      inputFields.mahsulot.value === "Boshqa"
        ? document.getElementById("customProduct")?.value || "Boshqa"
        : inputFields.mahsulot.value

    // Qarz miqdorini to'g'ri formatlash
    const qarzMiqdori = parseFloat(
      inputFields.qarzMiqdori.value.replace(/,/g, "")
    )

    const yangiMalumot = {
      mijozIsmi: inputFields.mijozIsmi.value,
      telefon: inputFields.telefon.value,
      mahsulot: mahsulotValue,
      qarzMiqdori: qarzMiqdori,
      sana: inputFields.sana.value,
      tolashMuddati: inputFields.tolashMuddati.value,
      status: "To'lanmagan",
    }

    if (tahrirlanayotganId) {
      // Mavjud qarzni yangilash
      qarzlar = qarzlar.map((qarz) => {
        if (qarz.id === tahrirlanayotganId) {
          return { ...qarz, ...yangiMalumot }
        }
        return qarz
      })
      alert("Qarz ma'lumotlari muvaffaqiyatli yangilandi!")

      // Telegram xabari
      const message = `🔄 <b>Qarz yangilandi</b>\n\n👤 Mijoz: ${
        yangiMalumot.mijozIsmi
      }\n📱 Telefon: ${yangiMalumot.telefon}\n👕 Mahsulot: ${
        yangiMalumot.mahsulot
      }\n💰 Qarz miqdori: ${yangiMalumot.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
        yangiMalumot.sana
      ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
        yangiMalumot.tolashMuddati
      ).toLocaleDateString()}`
      sendTelegramMessage(message)
    } else {
      // Yangi qarz qo'shish
      const newQarz = {
        id: Date.now(),
        ...yangiMalumot,
      }
      qarzlar.push(newQarz)
      alert("Yangi qarz muvaffaqiyatli qo'shildi!")

      // Telegram xabari
      const message = `➕ <b>Yangi qarz qo'shildi</b>\n\n👤 Mijoz: ${
        yangiMalumot.mijozIsmi
      }\n📱 Telefon: ${yangiMalumot.telefon}\n👕 Mahsulot: ${
        yangiMalumot.mahsulot
      }\n💰 Qarz miqdori: ${yangiMalumot.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
        yangiMalumot.sana
      ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
        yangiMalumot.tolashMuddati
      ).toLocaleDateString()}`
      sendTelegramMessage(message)
    }

    // Ma'lumotlarni saqlash
    localStorage.setItem("qarzlar", JSON.stringify(qarzlar))

    // Formani tozalash
    resetForm()

    // Ro'yxatni yangilash
    qarzlarniKorsatish()
    updateStats()
  } catch (error) {
    console.error("Xatolik yuz berdi:", error)
    alert(
      "Ma'lumotlarni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
    )
  }
})

// Sana bo'yicha filtrlash funksiyasi
function filterByDate(selectedDate) {
  const searchTerm = searchInput.value
  const currentFilterType =
    document.querySelector(".filter-btn.active")?.dataset.filter || "all"

  let filteredQarzlar = qarzlar.filter((qarz) => {
    const qarzSana = new Date(qarz.sana).toISOString().split("T")[0]
    // Agar selectedDate bo'sh bo'lsa, barcha sanalarni ko'rsatish
    if (!selectedDate) return true
    return qarzSana === selectedDate
  })

  // Mavjud qidiruv va filter turlarini ham hisobga olish
  filteredQarzlar = filteredQarzlar.filter(
    (qarz) =>
      qarz.mijozIsmi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qarz.telefon.includes(searchTerm) ||
      qarz.mahsulot.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter turiga qarab yana bir marta filtrlash
  if (currentFilterType === "tolangan") {
    filteredQarzlar = filteredQarzlar.filter(
      (qarz) => qarz.status === "To'langan"
    )
  } else if (currentFilterType === "tolanmagan") {
    const today = new Date()
    filteredQarzlar = filteredQarzlar.filter(
      (qarz) =>
        new Date(qarz.tolashMuddati) >= today && qarz.status === "To'lanmagan"
    )
  } else if (currentFilterType === "muddatiOtgan") {
    const today = new Date()
    filteredQarzlar = filteredQarzlar.filter(
      (qarz) =>
        new Date(qarz.tolashMuddati) < today && qarz.status === "To'lanmagan"
    )
  }

  qarzlarniKorsatish("", "all", filteredQarzlar) // Filterlangan ro'yxatni ko'rsatish
}

// Qarzlar ro'yxatini ko'rsatish funksiyasini yangilash (filterlangan ro'yxatni qabul qilish uchun)
function qarzlarniKorsatish(
  searchTerm = "",
  filterType = "all",
  customFilteredQarzlar = null
) {
  qarzlarRoyxati.innerHTML = ""

  let qarzListToShow =
    customFilteredQarzlar ||
    qarzlar.filter(
      (qarz) =>
        qarz.mijozIsmi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qarz.telefon.includes(searchTerm) ||
        qarz.mahsulot.toLowerCase().includes(searchTerm.toLowerCase())
    )

  // Filter turiga qarab filtrlash (agar customFilteredQarzlar berilmagan bo'lsa)
  if (!customFilteredQarzlar) {
    if (filterType === "tolangan") {
      qarzListToShow = qarzListToShow.filter(
        (qarz) => qarz.status === "To'langan"
      )
    } else if (filterType === "tolanmagan") {
      const today = new Date()
      qarzListToShow = qarzListToShow.filter(
        (qarz) =>
          new Date(qarz.tolashMuddati) >= today && qarz.status === "To'lanmagan"
      )
    } else if (filterType === "muddatiOtgan") {
      const today = new Date()
      qarzListToShow = qarzListToShow.filter(
        (qarz) =>
          new Date(qarz.tolashMuddati) < today && qarz.status === "To'lanmagan"
      )
    }
  }

  qarzListToShow.reverse() // Yangi qo'shilganlar yuqorida ko'rinishi uchun

  qarzListToShow.forEach((qarz) => {
    const tr = document.createElement("tr")

    // Qarz muddati o'tganmi tekshirish
    const bugun = new Date()
    const tolashMuddati = new Date(qarz.tolashMuddati)
    const muddatiOtgan = bugun > tolashMuddati && qarz.status === "To'lanmagan"

    // Qolgan kunlarni hisoblash
    const qolganKunlar = Math.ceil(
      (tolashMuddati - bugun) / (1000 * 60 * 60 * 24)
    )
    const qolganKunlarText =
      qarz.status === "To'langan"
        ? '<span class="text-green-600">To\'langan</span>'
        : muddatiOtgan
        ? `<span class="text-red-600 font-bold">${Math.abs(
            qolganKunlar
          )} kun o'tgan</span>`
        : qolganKunlar === 0
        ? '<span class="text-yellow-600">Bugun</span>'
        : qolganKunlar < 0
        ? `<span class="text-red-600 font-bold">${Math.abs(
            qolganKunlar
          )} kun o'tgan</span>`
        : `<span class="text-blue-600">${qolganKunlar} kun qoldi</span>`

    // Status badge
    const statusBadge =
      qarz.status === "To'langan"
        ? '<span class="px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">To\'langan</span>'
        : muddatiOtgan
        ? '<span class="px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-full">Muddati o\'tgan</span>'
        : '<span class="px-2 py-1 text-xs font-semibold text-yellow-600 bg-yellow-100 rounded-full">To\'lanmagan</span>'

    tr.innerHTML = `
            <td class="px-2 md:px-6 py-1 md:py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-7 md:h-10 w-7 md:w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-gray-500 text-sm md:text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${
                          qarz.mijozIsmi
                        }</div>
                        ${statusBadge}
                    </div>
                </div>
            </td>
            <td class="px-3 md:px-6 py-1 md:py-4 whitespace-nowrap">
                <a href="tel:${qarz.telefon}" class=" cursor-pointer text-sm text-blue-700 font-medium hover:underline">
                    <i class="fas fa-phone text-blue-700 mr-2 animate-pulse"></i>${
                      qarz.telefon
                    }
                </a>
            </td>
            <td class="px-3 md:px-6 py-1 md:py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                    <i class="fas fa-tshirt text-gray-400 mr-2"></i>${
                      qarz.mahsulot
                    }
                </div>
            </td>
            <td class="px-3 md:px-6 py-1 md:py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                    <i class="fas fa-money-bill-alt text-gray-400 mr-2"></i>${qarz.qarzMiqdori.toLocaleString()} so'm
                </div>
            </td>
            <td class="px-3 md:px-6 py-1 md:py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                    <i class="fas fa-calendar text-gray-400 mr-2"></i>${new Date(
                      qarz.sana
                    ).toLocaleDateString()}
                </div>
            </td>
            <td class="px-3 md:px-6 py-1 md:py-4 whitespace-nowrap">
                <div class="text-sm ${
                  muddatiOtgan ? "text-red-600 font-bold" : "text-gray-900"
                }">
                    <i class="fas fa-clock text-gray-400 mr-2"></i>${new Date(
                      qarz.tolashMuddati
                    ).toLocaleDateString()}
                    <div class="mt-1 text-xs font-medium">
                        ${qolganKunlarText}
                    </div>
                </div>
            </td>
            <td class="px-3 md:px-6 py-1 md:py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button onclick="qarzniTahrirlash(${qarz.id})" 
                    class="text-white bg-yellow-500 hover:bg-yellow-600 px-1 pl-2 sm:pl-3 sm:px-3 py-1 rounded-md">
                    <i class="fas fa-edit mr-1"></i>
                    <span class="hidden sm:inline">Tahrirlash</span>
                </button>
                <button onclick="qarzniTolash(${qarz.id})" 
                    class="text-white bg-green-500 hover:bg-green-600 px-1 pl-2 sm:pl-3 sm:px-3 py-1 rounded-md">
                    <i class="fas fa-check mr-1"></i>
                    <span class="hidden sm:inline">To'landi</span>
                </button>
                <button onclick="qarzniOchirish(${qarz.id})" 
                    class="text-white bg-red-500 hover:bg-red-600 px-1 pl-2 sm:pl-3 sm:px-3 py-1 rounded-md">
                    <i class="fas fa-trash mr-1"></i>
                    <span class="hidden sm:inline">O'chirish</span>
                </button>
            </td>
        `

    qarzlarRoyxati.appendChild(tr)
  })

  // Agar hech qanday qarz topilmasa
  if (qarzListToShow.length === 0) {
    const emptyMessage = document.createElement("tr")
    emptyMessage.innerHTML = `
            <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                <i class="fas fa-search text-4xl mb-2"></i>
                <p>Hech qanday qarz topilmadi</p>
            </td>
        `
    qarzlarRoyxati.appendChild(emptyMessage)
  }
}

// Qarzni to'langan deb belgilash
function qarzniTolash(id) {
  const qarz = qarzlar.find((q) => q.id === id)
  if (qarz) {
    qarz.status = "To'langan"
    localStorage.setItem("qarzlar", JSON.stringify(qarzlar))
    qarzlarniKorsatish()
    updateStats()

    // Telegram xabari
    const message = `✅ <b>Qarz to'landi</b>\n\n👤 Mijoz: ${
      qarz.mijozIsmi
    }\n📱 Telefon: ${qarz.telefon}\n👕 Mahsulot: ${
      qarz.mahsulot
    }\n💰 Qarz miqdori: ${qarz.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
      qarz.sana
    ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
      qarz.tolashMuddati
    ).toLocaleDateString()}`
    sendTelegramMessage(message)
  }
}

// Qarzni o'chirish
function qarzniOchirish(id) {
  if (confirm("Bu qarzni o'chirishni xohlaysizmi?")) {
    const qarz = qarzlar.find((q) => q.id === id)
    if (qarz) {
      qarzlar = qarzlar.filter((q) => q.id !== id)
      localStorage.setItem("qarzlar", JSON.stringify(qarzlar))
      qarzlarniKorsatish()
      updateStats()

      // Telegram xabari
      const message = `❌ <b>Qarz o'chirildi</b>\n\n👤 Mijoz: ${
        qarz.mijozIsmi
      }\n📱 Telefon: ${qarz.telefon}\n👕 Mahsulot: ${
        qarz.mahsulot
      }\n💰 Qarz miqdori: ${qarz.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
        qarz.sana
      ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
        qarz.tolashMuddati
      ).toLocaleDateString()}`
      sendTelegramMessage(message)
    }
  }
}

// Qidiruv funksionalligini qo'shish
searchInput.addEventListener("input", (e) => {
  // Hozirgi faol filter turini olish
  const activeFilterBtn = document.querySelector(".filter-btn.active")
  const currentFilterType = activeFilterBtn
    ? activeFilterBtn.dataset.filter
    : "all"

  qarzlarniKorsatish(e.target.value, currentFilterType)
})

// Filter tugmalarini boshqarish
function filterQarzlar(filterType) {
  // Barcha tugmalardan active klassini olib tashlash
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Tanlangan tugmaga active klassini qo'shish
  const selectedBtn = document.querySelector(`[data-filter="${filterType}"]`)
  selectedBtn.classList.add("active")

  // Ripple effekti uchun span yaratish va qo'shish
  const ripple = document.createElement("span")
  ripple.classList.add("ripple")

  // Ripple pozitsiyasini sozlash (agar kerak bo'lsa - hozircha CSS bilan hal qilingan)
  // const x = e.clientX - e.target.getBoundingClientRect().left;
  // const y = e.clientY - e.target.getBoundingClientRect().top;
  // ripple.style.left = `${x}px`;
  // ripple.style.top = `${y}px`;

  selectedBtn.appendChild(ripple)

  // Ripple effektini animatsiyadan keyin tozalash
  setTimeout(() => {
    ripple.remove()
  }, 600) // CSS animatsiya davomiyligi bilan mos bo'lishi kerak

  // Qidiruv maydoni qiymatini saqlab qolish
  const searchTerm = searchInput.value

  // Qarzlarni filterlab ko'rsatish
  qarzlarniKorsatish(searchTerm, filterType)
}

// Excelga export qilish va Telegramga yuborish
async function exportToExcel() {
  try {
    // Qarzlar ma'lumotlarini olish
    const qarzlar = JSON.parse(localStorage.getItem("qarzlar")) || []
    const bugun = new Date()

    // Sana va vaqtni formatlash
    const formattedDateTime = bugun
      .toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/[/:]/g, "-")
      .replace(",", "_")

    // Excel uchun ma'lumotlarni tayyorlash
    const excelData = qarzlar.map((qarz) => {
      const tolashMuddati = new Date(qarz.tolashMuddati)
      const qolganKunlar = Math.ceil(
        (tolashMuddati - bugun) / (1000 * 60 * 60 * 24)
      )

      let qolganKunlarText = ""
      if (qarz.status === "To'langan") {
        qolganKunlarText = "To'langan"
      } else if (qolganKunlar < 0) {
        qolganKunlarText = `${Math.abs(qolganKunlar)} kun o'tgan`
      } else if (qolganKunlar === 0) {
        qolganKunlarText = "Bugun"
      } else {
        qolganKunlarText = `${qolganKunlar} kun qoldi`
      }

      return {
        "Mijoz ismi": qarz.mijozIsmi,
        Telefon: qarz.telefon,
        Mahsulot: qarz.mahsulot,
        "Qarz miqdori": qarz.qarzMiqdori,
        Sana: new Date(qarz.sana).toLocaleDateString(),
        "To'lash muddati": new Date(qarz.tolashMuddati).toLocaleDateString(),
        Holati: qarz.status,
        "Qolgan kunlar": qolganKunlarText,
      }
    })

    // Worksheet yaratish
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Workbook yaratish
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Qarzlar")

    // Excel faylini yuklab olish
    const fileName = `Qarzlar_${formattedDateTime}.xlsx`

    // Excel faylini blob formatiga o'tkazish
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const file = new File([blob], fileName, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    // Telegramga yuborish
    const caption = `📊 Qarzlar hisoboti\n\n📅 Sana va vaqt: ${bugun.toLocaleString(
      "uz-UZ"
    )}\n👥 Jami mijozlar: ${qarzlar.length}\n💰 Jami qarzlar: ${qarzlar
      .reduce((sum, q) => sum + q.qarzMiqdori, 0)
      .toLocaleString()} so'm`

    // Excel faylini yuklab olish
    XLSX.writeFile(wb, fileName)

    // Telegramga yuborish
    await sendTelegramFile(file, caption)

    alert("Excel fayli yuklandi va Telegram kanalga yuborildi!")
  } catch (error) {
    console.error("Excel yaratishda xatolik:", error)
    alert("Excel faylini yaratishda xatolik yuz berdi!")
  }
}

// Kunlik hisobot yuborish uchun funksiya
function scheduleDailyReport() {
  const now = new Date()
  const reportTime = new Date(now)
  reportTime.setHours(22, 0, 0, 0) // 22:00 ga sozlash

  // Agar hozirgi vaqt 22:00 dan keyin bo'lsa, keyingi kunga o'tkazish
  if (now > reportTime) {
    reportTime.setDate(reportTime.getDate() + 1)
  }

  // Keyingi hisobot vaqtigacha qolgan vaqtni hisoblash
  const timeUntilReport = reportTime - now

  // Hisobotni yuborish
  setTimeout(async () => {
    try {
      await exportToExcel()
      console.log("Kunlik hisobot muvaffaqiyatli yuborildi!")
    } catch (error) {
      console.error("Kunlik hisobot yuborishda xatolik:", error)
    }
    // Keyingi kun uchun yangi vaqtni sozlash
    scheduleDailyReport()
  }, timeUntilReport)
}

// Sahifa yuklanganda qarzlarni ko'rsatish va statistikani yangilash
document.addEventListener("DOMContentLoaded", () => {
  qarzlarniKorsatish()
  updateStats()
  restoreFormData()
  handleProductSelection()
  scheduleDailyReport() // Kunlik hisobotni boshlash

  // Sahifa yuklanganda barchasi filterini faollashtirish
  document
    .querySelector('.filter-btn[data-filter="all"]')
    .classList.add("active")

  // Kalendar ikonkasi bosilganda kalendarni ochish
  const sanaFilterInput = document.getElementById("sanaFilter")
  const calendarIcon = document.querySelector(".calendar-icon")

  if (sanaFilterInput && calendarIcon) {
    calendarIcon.style.cursor = "pointer" // Kursor style o'zgartirish
    calendarIcon.addEventListener("click", () => {
      sanaFilterInput.showPicker() // Kalendarni ochish
    })
  }
})

// Raqamlarni formatlash
function formatNumber(input) {
  // Faqat raqamlar va bitta nuqtani qoldirish
  let value = input.value.replace(/[^\d.]/g, "")

  // Faqat bitta nuqta bo'lishini ta'minlash
  const parts = value.split(".")
  if (parts.length > 2) {
    value = parts[0] + "." + parts.slice(1).join("")
  }

  // Raqamlarni mingliklarga ajratish (nuqta qoldirilib, vergul qo'shiladi)
  // Oldingi vergullarni olib tashlash va raqamga aylantirish
  const num = parseFloat(value.replace(/,/g, ""))

  if (!isNaN(num)) {
    // toLocaleString() orqali formatlash, decimal places bilan
    const formattedNumber = num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    input.value = formattedNumber
  } else {
    input.value = value // Agar raqam bo'lmasa, kiritilgan qiymatni qoldiramiz
  }
}
