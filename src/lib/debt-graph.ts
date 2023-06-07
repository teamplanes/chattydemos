export interface Debt {
  from: string;
  to: string;
  amount: number;
}

export class DebtGraph {
  debts = new Map<string, Map<string, number>>();

  friends: string[];

  constructor(friends: string[]) {
    this.friends = friends;
    this.friends.forEach((user) => this.debts.set(user, new Map()));
  }

  addDebt(fromUser: string, toUser: string, amount: number) {
    if (!this.debts.has(fromUser)) {
      throw new Error(`User ${fromUser} does not exist`);
    }
    if (!this.debts.has(toUser)) {
      throw new Error(`User ${toUser} does not exist`);
    }
    const debtFromUser = this.debts.get(fromUser);
    if (!debtFromUser) {
      throw new Error(`User ${fromUser} does not exist`);
    }
    const currentDebt = debtFromUser.get(toUser) || 0;
    debtFromUser.set(toUser, currentDebt + amount);

    this.simplifyDebts();
  }

  addSharedExpense(
    payer: string,
    amount: number,
    users: string[] = this.friends,
  ) {
    users.forEach((user) => this.addDebt(user, payer, amount / users.length));
  }

  getSimplifiedDebts() {
    const debts: Array<Debt> = [];
    this.debts.forEach((debtsFromUser, user) => {
      debtsFromUser.forEach((amount, otherUser) => {
        debts.push({from: user, to: otherUser, amount});
      });
    });
    return debts;
  }

  private simplifyDebts() {
    this.debts.forEach((debtsFromUser, user) => {
      debtsFromUser.forEach((amount, otherUser) => {
        if (amount > 0) {
          const debtsToOtherUser = this.debts.get(otherUser);
          if (!debtsToOtherUser) {
            throw new Error(`User ${otherUser} does not exist`);
          }
          const reciprocalDebt = debtsToOtherUser.get(user) || 0;
          if (reciprocalDebt > 0) {
            // Reduce reciprocal debts
            if (amount > reciprocalDebt) {
              debtsFromUser.set(otherUser, amount - reciprocalDebt);
              debtsToOtherUser.delete(user);
            } else if (amount < reciprocalDebt) {
              debtsToOtherUser.set(user, reciprocalDebt - amount);
              debtsFromUser.delete(otherUser);
            } else {
              debtsFromUser.delete(otherUser);
              debtsToOtherUser.delete(user);
            }
          }
        }
      });
    });
  }
}
