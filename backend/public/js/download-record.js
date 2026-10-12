export async function downloadMedicalRecord() {
  const element = document.getElementById("recordContainer");

  if (!element) {
    alert("Record not found");
    return;
  }

  await html2pdf()
    .set({
      margin: 10,
      filename: "medical-record.pdf",
      image: {
        type: "jpeg",
        quality: 1,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    })
    .from(element)
    .save();
}