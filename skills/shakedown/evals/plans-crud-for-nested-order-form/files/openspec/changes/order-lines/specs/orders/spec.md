## ADDED Requirements

### Requirement: An order holds several lines
An agent SHALL create an order for a customer with a delivery date, optional notes, and one
or more lines, each a product and a quantity.

#### Scenario: Create an order with two lines
- **WHEN** the agent picks a customer, a delivery date, and adds two lines, then saves
- **THEN** the order appears in the orders list with a line count of 2

### Requirement: Lines can be edited after saving
An agent SHALL add, change and remove lines on a saved order.

#### Scenario: Remove a line
- **WHEN** the agent removes one of an order's lines and saves
- **THEN** the order shows only the remaining lines

### Requirement: Orders can be deleted
An agent SHALL delete an order. A deleted order no longer appears in the orders list.
