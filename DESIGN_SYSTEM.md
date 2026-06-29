# Suki CRM — Design System

## Table Header Color Rule

- Table headers always use `bg-primary` `text-white`.
- This automatically follows the user's active theme color (orange, blue, green, purple).
- The `--primary` CSS variable is mapped to `--accent` (the brand color) in `styles/themes.css` and `app/globals.css`.
- Never hardcode a specific color for table headers.
- Header text is always white for readability on any theme color.
- Use `crm-th` utility class or the `TableHead` shadcn component, both of which apply this rule automatically.

## Table Standards

- Wrap tables in `crm-card overflow-hidden` or a shadcn `Card` for consistent borders and rounded corners.
- Use `crm-table` for tables that use the CSS utility system, or the shadcn `Table` primitives.
- Header row height: `48px` (`h-12`).
- Data row height: `56px` (`h-14`).
- Cell padding: `px-4 py-3`.
- Header text: `text-sm font-semibold uppercase tracking-wider text-white`.
- Data text: `text-sm text-foreground`.
- Empty/null values: show `—` in `text-muted-foreground`.
- Row hover: `hover:bg-muted/50` (light mode), `dark:hover:bg-muted/30` (dark mode).
- Alternating rows: `odd:bg-background even:bg-muted/20` (light mode), `dark:odd:bg-card dark:even:bg-muted/10` (dark mode).
- Last row: no border bottom.

## Theme Color System

- Active theme color is stored in CSS variables:
  - `--primary` (alias for `--accent`)
  - `--accent` (the brand color)
  - `--brand-primary` (same as accent)
  - `--text-on-brand` (white or dark contrast text)
- The sidebar uses `--sidebar-active` and `--sidebar-active-bg` which are derived from `--brand-primary`.
- Tables use `--primary` (same source) so headers match the sidebar active state.

## Usage Examples

### CSS Utility Classes

```tsx
<div className="crm-card overflow-hidden">
  <div className="overflow-x-auto">
    <table className="crm-table">
      <thead>
        <tr>
          <th className="crm-th">Name</th>
          <th className="crm-th text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr className="crm-tr">
          <td className="crm-td">Value</td>
          <td className="crm-td text-right">...</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### shadcn Table Components

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Value</TableCell>
      <TableCell className="text-right">...</TableCell>
    </TableRow>
  </TableBody>
</Table>
```
