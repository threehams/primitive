describe("hack-the-planet", () => {
  beforeEach(() => {
    return cy.visit("/");
  });

  it("should display welcome message", () => {
    cy.get('[data-test="todo"]').should("have.length", 2);
    cy.get("button#add-todo").click();
    cy.get('[data-test="todo"]').should("have.length", 3);
  });
});
