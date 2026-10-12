export async function loadCountries(selectId = "country_code") {
  try {
    const COUNTRY_CODES = [
      { code: "+91", country: "India", flag: "🇮🇳" },
      { code: "+1", country: "USA", flag: "🇺🇸" },
      { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
      { code: "+61", country: "Australia", flag: "🇦🇺" },
      { code: "+971", country: "UAE", flag: "🇦🇪" },
      { code: "+86", country: "China", flag: "🇨🇳" },
      { code: "+81", country: "Japan", flag: "🇯🇵" },
      { code: "+49", country: "Germany", flag: "🇩🇪" },
      { code: "+33", country: "France", flag: "🇫🇷" },
      { code: "+65", country: "Singapore", flag: "🇸🇬" },
    ];

    const select = document.getElementById(selectId);

    if (!select) return;

    select.innerHTML = "";

    COUNTRY_CODES
      .sort((a, b) => a.country.localeCompare(b.country))
      .forEach(country => {

        const option = document.createElement("option");

        option.value = country.code;
        option.textContent =
          `${country.flag} ${country.country} (${country.code})`;

        if (country.country === "India") {
          option.selected = true;
        }

        select.appendChild(option);
      });

  } catch (error) {
    console.error(error);
  }
}