import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetChatHistory, 
  useSendMessage, 
  useClearChatHistory, 
  getGetChatHistoryQueryKey 
} from "@workspace/api-client-react";
import type { ChatMessage } from "@workspace/api-client-react";

export function useRudyChat() {
  const queryClient = useQueryClient();
  const queryKey = getGetChatHistoryQueryKey();

  const historyQuery = useGetChatHistory();

  const sendMessageMutation = useSendMessage({
    mutation: {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey });

        const previousData = queryClient.getQueryData<{ messages: ChatMessage[] }>(queryKey);

        const optimisticMessage: ChatMessage = {
          role: "user",
          content: variables.data.message,
          timestamp: new Date().toISOString(),
        };

        queryClient.setQueryData<{ messages: ChatMessage[] }>(queryKey, (old) => ({
          messages: [...(old?.messages || []), optimisticMessage],
        }));

        return { previousData };
      },
      onError: (_err, _newMsg, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(queryKey, context.previousData);
        }
      },
      onSuccess: (data) => {
        queryClient.setQueryData(queryKey, { messages: data.messages });
      },
    },
  });

  const clearHistoryMutation = useClearChatHistory({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(queryKey, { messages: [] });
      },
    },
  });

  return {
    messages: historyQuery.data?.messages || [],
    isLoadingHistory: historyQuery.isLoading,
    sendMessage: (message: string) => sendMessageMutation.mutate({ data: { message } }),
    isSending: sendMessageMutation.isPending,
    clearHistory: () => clearHistoryMutation.mutate(),
    isClearing: clearHistoryMutation.isPending,
  };
}
