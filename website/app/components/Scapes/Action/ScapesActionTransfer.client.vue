<template>
  <Button
    class="small"
    @click="open = true"
  >
    Transfer
  </Button>

  <Dialog
    v-model:open="open"
    title="Transfer Scape"
    class="scapes-action__dialog"
  >
    <div class="scapes-action__form">
      <p class="scapes-action__copy">
        Send Scape #{{ scapeId }} to another wallet. This cannot be undone.
      </p>
      <EvmAddressInput
        v-model="recipientInput"
        autocomplete="off"
        spellcheck="false"
        placeholder="Recipient wallet address or ENS name"
      />
      <p
        v-if="recipientError"
        class="scapes-action__error"
      >
        {{ recipientError }}
      </p>
      <Actions>
        <Button
          class="small"
          @click="handleCancel"
        >
          Cancel
        </Button>
        <Button
          class="small"
          :disabled="!recipientAddress || Boolean(recipientError)"
          @click="handleContinue"
        >
          Continue
        </Button>
      </Actions>
    </div>
  </Dialog>

  <EvmTransactionFlow
    ref="transactionFlowRef"
    :text="transferText"
    :request="transferRequest"
    auto-close-success
    @complete="handleTransferComplete"
  />
</template>

<script setup lang="ts">
import { getAddress, isAddress, type Address, type Hash } from 'viem'

const props = defineProps<{
  scapeId: string
  owner: string
}>()

const emit = defineEmits<{
  transferComplete: []
}>()

const { transfer } = useScapeTransfer(
  () => props.scapeId,
  () => props.owner as Address,
)

const open = ref(false)
const recipientInput = ref('')
const recipientIdentifier = computed(() => {
  const recipient = recipientInput.value.trim()
  if (!recipient) return undefined
  return isAddress(recipient) || recipient.includes('.') ? recipient : undefined
})
const { data: recipientEns, pending: resolvingRecipient } = useEns(
  recipientIdentifier,
)

const recipientAddress = computed<Address | null>(() => {
  const recipient = recipientEns.value?.address
  return recipient && isAddress(recipient) ? getAddress(recipient) : null
})

const recipientError = computed(() => {
  const recipient = recipientInput.value.trim()
  if (!recipient) return null
  if (resolvingRecipient.value) return 'Resolving recipient…'
  if (!recipientAddress.value) {
    return 'Enter a valid wallet address or an ENS name with an address.'
  }
  if (recipientAddress.value.toLowerCase() === props.owner.toLowerCase()) {
    return 'Choose a wallet other than the current owner.'
  }
  return null
})

const transactionFlowRef = ref<{
  initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown>
} | null>(null)

const transferRequest = async (): Promise<Hash> => {
  if (!recipientAddress.value) throw new Error('A recipient wallet is required.')
  return transfer(recipientAddress.value)
}

const handleContinue = async () => {
  if (!recipientAddress.value || recipientError.value) return
  open.value = false
  await nextTick()
  await transactionFlowRef.value?.initializeRequest(transferRequest)
}

const handleCancel = () => {
  open.value = false
  recipientInput.value = ''
}

const handleTransferComplete = () => {
  recipientInput.value = ''
  emit('transferComplete')
}

const transferText = computed(() => ({
  title: {
    confirm: 'Transfer Scape',
    requesting: 'Confirm in Wallet',
    waiting: 'Transferring Scape',
    complete: 'Transferred!',
  },
  lead: {
    confirm: `Transfer Scape #${props.scapeId} to ${recipientAddress.value ?? 'the recipient'}?`,
    requesting: 'Please confirm the transaction in your wallet.',
    waiting: 'Your transfer is being processed onchain.',
    complete: 'Your scape has been transferred.',
  },
  action: {
    confirm: 'Transfer',
    error: 'Try Again',
  },
}))
</script>

<style scoped>
.scapes-action__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}

.scapes-action__copy,
.scapes-action__error {
  margin: 0;
  font-size: var(--font-sm);
}

.scapes-action__copy {
  color: var(--muted);
}

.scapes-action__error {
  color: var(--muted);
}

.actions {
  margin-top: var(--spacer);
}
</style>
