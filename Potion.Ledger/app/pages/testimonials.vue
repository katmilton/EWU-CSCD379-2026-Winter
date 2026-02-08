<script setup lang="ts">
import type { TestimonialCreateRequest, TestimonialDto, TestimonialsResponse } from "~/composables/usePotionLedgerRun"

const api = usePotionLedgerApi()

const loading = ref(true)
const posting = ref(false)
const error = ref<string | null>(null)

const data = ref<TestimonialsResponse | null>(null)

const form = reactive<TestimonialCreateRequest>({
  name: "",
  rating: 5,
  message: "",
})

const formError = ref<string | null>(null)
const postedOk = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.getTestimonials()
  } catch (e: any) {
    error.value = e?.data || e?.message || "Failed to load testimonials."
  } finally {
    loading.value = false
  }
}

onMounted(load)

function fmtUtc(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function validate() {
  const name = form.name.trim()
  const msg = form.message.trim()
  if (!name) return "Name is required."
  if (name.length > 24) return "Name must be 24 characters or less."
  if (form.rating < 1 || form.rating > 5) return "Rating must be 1–5."
  if (!msg) return "Message is required."
  if (msg.length > 400) return "Message must be 400 characters or less."
  return null
}

async function submit() {
  postedOk.value = false
  formError.value = validate()
  if (formError.value) return

  posting.value = true
  try {
    const saved = await api.postTestimonial({
      name: form.name.trim(),
      rating: form.rating,
      message: form.message.trim(),
    })

    const current = data.value?.testimonials ?? []
    // Prepend newest
    data.value = {
      generatedUtc: new Date().toISOString(),
      testimonials: [saved, ...current],
    }

    form.name = ""
    form.rating = 5
    form.message = ""
    postedOk.value = true
  } catch (e: any) {
    formError.value = e?.data || e?.message || "Failed to submit testimonial."
  } finally {
    posting.value = false
  }
}

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n))
}

function clearNotices() {
  formError.value = null
  postedOk.value = false
}
</script>

<template>
  <v-card class="pl-card pa-4" rounded="lg" elevation="1">
    <div class="pl-row">
      <div>
        <h1 class="pl-title">Testimonials</h1>
        <p class="pl-sub">
          Real witches. Real feedback.
        </p>
      </div>

      <div class="pl-actions">
        <v-btn variant="outlined" to="/play">Play</v-btn>
        <v-btn variant="outlined" to="/leaderboard">Leaderboard</v-btn>
        <v-btn color="primary" variant="flat" @click="load">Refresh</v-btn>
      </div>
    </div>

    <v-divider class="my-4" />

    <v-card class="pl-panel pa-4" variant="tonal">
      <h3 class="pl-h">Leave a testimonial</h3>
      <div class="pl-muted mb-3">
        Keep it short and sweet (name ≤ 24 chars, message ≤ 400).
      </div>

      <v-alert v-if="postedOk" type="success" variant="tonal" class="mb-3">
        Thanks! Your testimonial was added.
      </v-alert>

      <v-alert v-if="formError" type="error" variant="tonal" class="mb-3">
        {{ formError }}
      </v-alert>

      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="form.name"
            label="Name"
            maxlength="24"
            counter
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="form.rating"
            label="Rating"
            :items="[1,2,3,4,5]"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <v-col cols="12" md="5">
          <v-textarea
            v-model="form.message"
            label="Message"
            maxlength="400"
            counter
            rows="2"
            auto-grow
            variant="outlined"
            density="comfortable"
          />
        </v-col>
      </v-row>

      <div class="pl-actions">
        <v-btn :loading="posting" color="primary" @click="submit">Submit</v-btn>
        <v-btn variant="text" @click="clearNotices">Clear notices</v-btn>
      </div>
    </v-card>

    <v-divider class="my-4" />

    <div v-if="loading">
      <div class="d-flex align-center ga-3 mb-3">
        <v-progress-circular indeterminate />
        <span class="pl-muted">Gathering whispers…</span>
      </div>
      <v-skeleton-loader type="heading" class="mb-3" />
      <v-skeleton-loader type="list-item-avatar, list-item-avatar, list-item-avatar" />
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <template v-else>
      <div class="pl-muted mb-3">
        Loaded: <b>{{ data?.generatedUtc ? fmtUtc(data.generatedUtc) : "—" }}</b>
      </div>

      <div class="pl-grid" style="grid-template-columns: 1fr;">
        <v-card
          v-for="t in (data?.testimonials || [])"
          :key="t.id"
          class="pl-panel pa-4 pl-review"
          variant="tonal"
        >
          <div class="pl-reviewTop">
            <div class="pl-avatar" aria-hidden="true">
              {{ (t.name || '?').slice(0,1).toUpperCase() }}
            </div>

            <div class="pl-reviewMeta">
              <div class="pl-reviewName">
                <b>{{ t.name }}</b>
                <span class="pl-muted">• {{ fmtUtc(t.createdUtc) }}</span>
              </div>
              <div class="pl-reviewBadges">
                <v-chip
                  :color="t.rating >= 4 ? 'success' : t.rating === 3 ? 'warning' : 'error'"
                  variant="tonal"
                  size="small"
                  :prepend-icon="t.rating >= 4 ? 'mdi-thumb-up-outline' : t.rating === 3 ? 'mdi-emoticon-neutral-outline' : 'mdi-thumb-down-outline'"
                >
                  {{ t.rating >= 4 ? 'Recommended' : t.rating === 3 ? 'Mixed' : 'Not recommended' }}
                </v-chip>
                <v-chip color="warning" variant="tonal" size="small">{{ stars(t.rating) }}</v-chip>
              </div>
            </div>
          </div>

          <div class="mt-3 pl-reviewText" style="white-space: pre-wrap;">{{ t.message }}</div>
        </v-card>

        <div v-if="(data?.testimonials?.length || 0) === 0" class="pl-muted">
          No testimonials yet — be the first!
        </div>
      </div>
    </template>
  </v-card>
</template>

<style scoped>
.pl-reviewTop {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  align-items: start;
}

.pl-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 900;
  letter-spacing: 0.3px;
  border: 1px solid rgba(190, 255, 199, 0.16);
  background:
    radial-gradient(26px 20px at 30% 30%, rgba(255, 255, 255, 0.10), transparent 70%),
    linear-gradient(135deg, rgba(183, 139, 255, 0.24), rgba(157, 255, 176, 0.18));
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
}

.pl-reviewBadges {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pl-reviewText {
  color: rgba(245, 244, 255, 0.88);
  line-height: 1.45;
}
</style>
