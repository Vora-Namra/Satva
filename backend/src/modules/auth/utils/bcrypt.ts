import bcrypt from "bcrypt";

export async function getHashedPassword(password: string) {
  const hashed_pass = await bcrypt.hash(password, 10);
  return hashed_pass;
}

export async function comparePassword(
  password: string,
  db_hashed_password: string,
) {
  const isSame = await bcrypt.compare(password, db_hashed_password);
  return isSame;
}
