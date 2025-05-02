export const downloadBlob = async (
  content: any[],
  filename: string,
  contentType: string
) => {
  const blob = new Blob(content, { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
