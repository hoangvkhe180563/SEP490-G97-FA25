export const isValidVietnamPhone = (s?: string | null) => {
  if (!s) return false;
  const v = String(s).replace(/\s|-/g, "");
  const re = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;
  return re.test(v);
};
