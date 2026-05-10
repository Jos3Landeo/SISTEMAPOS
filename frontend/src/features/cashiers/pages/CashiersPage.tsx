import { FormEvent, useState } from "react";
import { KeyRound, PencilLine, RotateCcw, Save, ShieldCheck, UserRoundPlus } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { permissionOptions, type AppPermission } from "../../auth/access";
import {
  useCreateRole,
  useCreateUser,
  useRoles,
  useUpdateRole,
  useUpdateUser,
  useUsers,
} from "../hooks/useCashiers";
import type { CashierUser, Role } from "../types/cashier";

const inputClassName = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm";
const textareaClassName = "min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm";

type RoleFormState = {
  name: string;
  description: string;
  permissions: AppPermission[];
};

type UserFormState = {
  role_id: string;
  full_name: string;
  username: string;
  email: string;
  password: string;
  is_active: boolean;
};

const emptyRoleForm: RoleFormState = {
  name: "",
  description: "",
  permissions: [],
};

const emptyUserForm: UserFormState = {
  role_id: "",
  full_name: "",
  username: "",
  email: "",
  password: "",
  is_active: true,
};

function mapRoleToForm(role: Role): RoleFormState {
  return {
    name: role.name,
    description: role.description || "",
    permissions: role.permissions,
  };
}

function mapUserToForm(user: CashierUser): UserFormState {
  return {
    role_id: user.role.id,
    full_name: user.full_name,
    username: user.username,
    email: user.email || "",
    password: "",
    is_active: user.is_active,
  };
}

export function CashiersPage() {
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<CashierUser | null>(null);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  function resetRoleForm() {
    setEditingRole(null);
    setRoleForm(emptyRoleForm);
    setRoleError(null);
  }

  function resetUserForm() {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setUserError(null);
  }

  function togglePermission(permission: AppPermission) {
    setRoleForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  }

  async function handleRoleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRoleFeedback(null);
    setRoleError(null);

    try {
      if (editingRole) {
        await updateRole.mutateAsync({
          roleId: editingRole.id,
          payload: {
            name: roleForm.name,
            description: roleForm.description,
            permissions: roleForm.permissions,
          },
        });
        setRoleFeedback("Rol actualizado.");
      } else {
        await createRole.mutateAsync({
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
        });
        setRoleFeedback("Rol creado.");
      }
      resetRoleForm();
    } catch (submissionError) {
      setRoleError(submissionError instanceof Error ? submissionError.message : "No fue posible guardar el rol.");
    }
  }

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUserFeedback(null);
    setUserError(null);

    try {
      if (editingUser) {
        await updateUser.mutateAsync({
          userId: editingUser.id,
          payload: {
            role_id: userForm.role_id,
            full_name: userForm.full_name,
            username: userForm.username,
            email: userForm.email || null,
            password: userForm.password || undefined,
            is_active: userForm.is_active,
          },
        });
        setUserFeedback("Cajero actualizado.");
      } else {
        await createUser.mutateAsync({
          role_id: userForm.role_id,
          full_name: userForm.full_name,
          username: userForm.username,
          email: userForm.email || null,
          password: userForm.password,
        });
        setUserFeedback("Cajero creado.");
      }
      resetUserForm();
    } catch (submissionError) {
      setUserError(submissionError instanceof Error ? submissionError.message : "No fue posible guardar el cajero.");
    }
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Cajeros"
        description="Crea usuarios, asignales un rol y define exactamente a que modulos puede entrar cada perfil."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-brand-50 p-2 text-brand-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {editingRole ? "Editar rol" : "Nuevo rol"}
                  </h2>
                  <p className="text-sm text-slate-500">Los accesos del cajero se administran desde su rol.</p>
                </div>
              </div>

              {(editingRole || roleForm.name) && (
                <Button type="button" variant="secondary" onClick={resetRoleForm}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>

            {roleFeedback || roleError ? (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  roleError
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {roleError || roleFeedback}
              </div>
            ) : null}

            <form className="mt-5 space-y-4" onSubmit={handleRoleSubmit}>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Nombre del rol</span>
                <input
                  className={inputClassName}
                  value={roleForm.name}
                  onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Descripcion</span>
                <textarea
                  className={textareaClassName}
                  value={roleForm.description}
                  onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Accesos habilitados</p>
                <div className="grid gap-3">
                  {permissionOptions.map((permission) => (
                    <label
                      key={permission.value}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.includes(permission.value)}
                        onChange={() => togglePermission(permission.value)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-800">{permission.label}</span>
                        <span className="block text-sm text-slate-500">{permission.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
                  {editingRole ? <Save className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  {editingRole ? "Guardar rol" : "Crear rol"}
                </Button>
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
            <div className="border-b border-slate-200 px-4 py-4">
              <h2 className="text-base font-semibold text-slate-950">Roles creados</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {rolesLoading ? (
                <p className="px-4 py-5 text-sm text-slate-500">Cargando roles...</p>
              ) : roles.length === 0 ? (
                <p className="px-4 py-5 text-sm text-slate-500">Todavia no hay roles.</p>
              ) : (
                roles.map((role) => (
                  <div key={role.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div>
                          <p className="font-medium text-slate-900">{role.name}</p>
                          <p className="text-sm text-slate-500">{role.description || "Sin descripcion"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.length > 0 ? (
                            role.permissions.map((permission) => {
                              const option = permissionOptions.find((item) => item.value === permission);
                              return (
                                <span
                                  key={permission}
                                  className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                                >
                                  {option?.label || permission}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-sm text-slate-400">Sin accesos asignados</span>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setRoleFeedback(null);
                          setRoleError(null);
                          setEditingRole(role);
                          setRoleForm(mapRoleToForm(role));
                        }}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-brand-50 p-2 text-brand-600">
                  <UserRoundPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {editingUser ? "Editar cajero" : "Nuevo cajero"}
                  </h2>
                  <p className="text-sm text-slate-500">Cada usuario hereda los accesos del rol asignado.</p>
                </div>
              </div>

              {(editingUser || userForm.full_name || userForm.username) && (
                <Button type="button" variant="secondary" onClick={resetUserForm}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>

            {userFeedback || userError ? (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  userError
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {userError || userFeedback}
              </div>
            ) : null}

            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleUserSubmit}>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Nombre completo</span>
                <input
                  className={inputClassName}
                  value={userForm.full_name}
                  onChange={(event) => setUserForm((current) => ({ ...current, full_name: event.target.value }))}
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Rol</span>
                <select
                  className={inputClassName}
                  value={userForm.role_id}
                  onChange={(event) => setUserForm((current) => ({ ...current, role_id: event.target.value }))}
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Usuario</span>
                <input
                  className={inputClassName}
                  value={userForm.username}
                  onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))}
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Correo</span>
                <input
                  className={inputClassName}
                  type="email"
                  value={userForm.email}
                  onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                <span>{editingUser ? "Nueva contrasena (opcional)" : "Contrasena"}</span>
                <input
                  className={inputClassName}
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                  required={!editingUser}
                />
              </label>

              {editingUser ? (
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={(event) => setUserForm((current) => ({ ...current, is_active: event.target.checked }))}
                  />
                  <span>Usuario activo</span>
                </label>
              ) : null}

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                  {editingUser ? <Save className="mr-2 h-4 w-4" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  {editingUser ? "Guardar cajero" : "Crear cajero"}
                </Button>
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
            <div className="border-b border-slate-200 px-4 py-4">
              <h2 className="text-base font-semibold text-slate-950">Usuarios creados</h2>
            </div>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={5}>
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={5}>
                      Todavia no hay usuarios.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{user.full_name}</div>
                        <div className="text-slate-500">{user.email || "Sin correo"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.username}</td>
                      <td className="px-4 py-3 text-slate-600">{user.role.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {user.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setUserFeedback(null);
                            setUserError(null);
                            setEditingUser(user);
                            setUserForm(mapUserToForm(user));
                          }}
                        >
                          <PencilLine className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
