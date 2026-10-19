import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Dashboard, Lanes } from "../../types"
import * as api from "../../api/operations"
import { pushUndo } from "../../undo"
import { keys } from "../keys"

export function useCreateDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.createDashboard(name),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useRenameDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.renameDashboard(id, name),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useSetDashboardSort() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, sort }: { id: string; sort: string[] }) =>
      api.setDashboardSort(id, sort),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

/**
 * Written to the cache up front: the lanes dialog builds each change on the
 * last, so a second edit before the first settles must already see it.
 */
export function useSetDashboardLanes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, lanes }: { id: string; lanes: Lanes }) =>
      api.setDashboardLanes(id, lanes),
    onMutate: async ({ id, lanes }) => {
      // A read already in flight would land the old setting over this one.
      await qc.cancelQueries({ queryKey: keys.dashboards })
      qc.setQueryData<Dashboard[]>(keys.dashboards, (list) =>
        list?.map((d) => (d.id === id ? { ...d, lanes } : d))
      )
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useDeleteDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteDashboard(id),
    onSuccess: (_data, id) => pushUndo("dashboards", id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.dashboards })
      qc.invalidateQueries({ queryKey: keys.digest })
      qc.invalidateQueries({ queryKey: keys.trash })
    },
  })
}
