const SUPABASE_URL = "https://debvzcezinyhbohbelji.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYnZ6Y2V6aW55aGJvaGJlbGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyNTU4MjEsImV4cCI6MjExMDgzMTgyMX0.WJtTYRAJGttFqxLibUCLtCvXu85Y3Dq7-hWxe7fFGCU";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadStats() {
  const { count: donorsCount } = await supabaseClient
    .from("donors")
    .select("*", { count: "exact", head: true });

  const { count: requestsCount } = await supabaseClient
    .from("blood_requests")
    .select("*", { count: "exact", head: true });

  document.getElementById("donorCount").textContent = donorsCount ?? 0;
  document.getElementById("requestCount").textContent = requestsCount ?? 0;
}

async function searchDonors() {
  const bloodGroup = document.getElementById("searchBloodGroup").value;
  const city = document.getElementById("searchCity").value.trim();
  const resultsEl = document.getElementById("donorResults");
  resultsEl.innerHTML = "<p>Searching donors...</p>";

  let query = supabaseClient.from("donors").select("*").order("id", { ascending: false });

  if (bloodGroup) {
    query = query.eq("blood_group", bloodGroup);
  }
  if (city) {
    query = query.ilike("city", `%${city}%`);
  }

  const { data, error } = await query;

  if (error) {
    resultsEl.innerHTML = `<p style="color:#b91c24;">Error: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    resultsEl.innerHTML = "<p>No matching donors found.</p>";
    return;
  }

  resultsEl.innerHTML = data
    .map(
      (d) => `
      <div class="donor-item">
        <strong>${d.name}</strong><span class="badge">${d.blood_group}</span>
        <div>City: ${d.city} | Age: ${d.age ?? "-"}</div>
        <div>Phone: ${d.phone} | Email: ${d.email ?? "-"}</div>
      </div>
    `
    )
    .join("");
}

document.getElementById("donorForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("donorName").value.trim(),
    age: Number(document.getElementById("donorAge").value),
    blood_group: document.getElementById("donorBloodGroup").value,
    city: document.getElementById("donorCity").value.trim(),
    phone: document.getElementById("donorPhone").value.trim(),
    email: document.getElementById("donorEmail").value.trim(),
  };

  const { error } = await supabaseClient.from("donors").insert([payload]);

  if (error) {
    alert("Failed to register donor: " + error.message);
    return;
  }

  alert("Donor registered successfully!");
  e.target.reset();
  loadStats();
  searchDonors();
});

async function loadRequests() {
  const reqEl = document.getElementById("requestResults");
  const { data, error } = await supabaseClient
    .from("blood_requests")
    .select("*")
    .order("id", { ascending: false });

  if (error || !data || data.length === 0) {
    reqEl.innerHTML = "";
    return;
  }

  reqEl.innerHTML = data
    .map(
      (r) => `
      <div class="donor-item">
        <strong>${r.patient_name || "Emergency Request"}</strong><span class="badge">${r.blood_group}</span>
        <div>City: ${r.city} | Hospital: ${r.hospital || "-"}</div>
        <div>Contact: ${r.phone}</div>
      </div>
    `
    )
    .join("");
}

document.getElementById("requestForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    patient_name: document.getElementById("patientName").value.trim(),
    blood_group: document.getElementById("reqBloodGroup").value,
    city: document.getElementById("reqCity").value.trim(),
    hospital: document.getElementById("reqHospital").value.trim(),
    phone: document.getElementById("reqPhone").value.trim(),
  };

  const { error } = await supabaseClient.from("blood_requests").insert([payload]);

  if (error) {
    alert("Failed to submit request: " + error.message);
    return;
  }

  alert("Blood request submitted!");
  e.target.reset();
  loadStats();
  loadRequests();
});

loadStats();
searchDonors();
loadRequests();
