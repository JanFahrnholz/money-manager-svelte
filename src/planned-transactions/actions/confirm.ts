export default async function confirmPlannedTransaction(
  { dispatch },
  transaction
) {
  try {
    await dispatch("createTransaction", transaction);
    await dispatch("deletePlannedTransaction", transaction.id);
  } catch (error) {
    throw new Error(error);
  }
}
