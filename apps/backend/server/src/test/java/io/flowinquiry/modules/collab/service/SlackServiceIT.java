package io.flowinquiry.modules.collab.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.slack.api.Slack;
import com.slack.api.methods.MethodsClient;
import com.slack.api.methods.SlackApiException;
import com.slack.api.methods.request.chat.ChatPostMessageRequest;
import com.slack.api.methods.response.chat.ChatPostMessageResponse;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.collab.domain.SlackMessage;
import java.io.IOException;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

@IntegrationTest
@TestPropertySource(properties = "flowinquiry.slack.token=xoxb-your-test-token")
public class SlackServiceIT {
    private static MockedStatic<Slack> mockedStaticSlack;
    private static Slack slack;
    private static MethodsClient methods;
    private static final String TOKEN = "xoxb-your-test-token";
    private static final String EXPECTED_CHAN_ID = "ChannelID";
    private static final String EXPECTED_MESSAGE = "MESSAGE";

    @Autowired private SlackService slackService;

    @BeforeAll
    static void setup() {
        mockedStaticSlack = Mockito.mockStatic(Slack.class);
        slack = mock(Slack.class);
        methods = mock(MethodsClient.class);
        mockedStaticSlack.when(Slack::getInstance).thenReturn(slack);
        when(slack.methods(TOKEN)).thenReturn(methods);
    }

    @BeforeEach
    void setupEach() {
        mockedStaticSlack.clearInvocations();
        clearInvocations(slack);
        clearInvocations(methods);
    }

    @Test
    void shouldSendSlackMessageSuccessfully() throws IOException, SlackApiException {

        // Arrange (Prepare mocks)
        final ChatPostMessageRequest EXPECTED_SLACK_REQUEST =
                ChatPostMessageRequest.builder()
                        .channel(EXPECTED_CHAN_ID) // Use a channel ID `C1234567` is preferable
                        .text(EXPECTED_MESSAGE)
                        .build();
        final ChatPostMessageResponse messageResponse = mock(ChatPostMessageResponse.class);

        when(messageResponse.isOk()).thenReturn(true);
        when(methods.chatPostMessage(any(ChatPostMessageRequest.class)))
                .thenReturn(messageResponse);

        final ArgumentCaptor<ChatPostMessageRequest> messageRequestArgCaptor =
                ArgumentCaptor.forClass(ChatPostMessageRequest.class);
        SlackMessage slackMessage = new SlackMessage(EXPECTED_MESSAGE, EXPECTED_CHAN_ID);

        // Act
        ChatPostMessageResponse actualMessageResponse = slackService.sendSlackMessage(slackMessage);

        // Assert
        verify(slack).methods(any());
        verify(methods).chatPostMessage(messageRequestArgCaptor.capture());

        ChatPostMessageRequest actualMessageRequest = messageRequestArgCaptor.getValue();
        Assertions.assertEquals(EXPECTED_SLACK_REQUEST, actualMessageRequest);
        Assertions.assertTrue(actualMessageResponse.isOk());
    }

    @Test
    void shouldFailToSendSlackMessage() throws IOException, SlackApiException {

        // Arrange (Prepare mocks)
        final String EXPECTED_CHAN_ID = "ChannelID";
        final String EXPECTED_MESSAGE = "MESSAGE";
        final ChatPostMessageRequest EXPECTED_SLACK_REQUEST =
                ChatPostMessageRequest.builder()
                        .channel(EXPECTED_CHAN_ID) // Use a channel ID `C1234567` is preferable
                        .text(EXPECTED_MESSAGE)
                        .build();
        final ChatPostMessageResponse messageResponse = mock(ChatPostMessageResponse.class);
        when(messageResponse.isOk()).thenReturn(false);
        when(methods.chatPostMessage(any(ChatPostMessageRequest.class)))
                .thenReturn(messageResponse);

        final ArgumentCaptor<ChatPostMessageRequest> messageRequestArgCaptor =
                ArgumentCaptor.forClass(ChatPostMessageRequest.class);
        SlackMessage slackMessage = new SlackMessage(EXPECTED_MESSAGE, EXPECTED_CHAN_ID);

        // Act
        ChatPostMessageResponse actualMessageResponse = slackService.sendSlackMessage(slackMessage);

        // Assert
        verify(slack).methods(any());
        verify(methods).chatPostMessage(messageRequestArgCaptor.capture());

        ChatPostMessageRequest actualMessageRequest = messageRequestArgCaptor.getValue();
        Assertions.assertEquals(EXPECTED_SLACK_REQUEST, actualMessageRequest);
        Assertions.assertFalse(actualMessageResponse.isOk());
    }

    @Test
    void whenIOExceptionOccurs_thenSendSlackMessageThrowsIOException()
            throws IOException, SlackApiException {

        // Arrange (Prepare mocks)
        final String EXPECTED_CHAN_ID = "ChannelID";
        final String EXPECTED_MESSAGE = "MESSAGE";
        final ChatPostMessageRequest EXPECTED_SLACK_REQUEST =
                ChatPostMessageRequest.builder()
                        .channel(EXPECTED_CHAN_ID) // Use a channel ID `C1234567` is preferable
                        .text(EXPECTED_MESSAGE)
                        .build();
        final ChatPostMessageResponse messageResponse = mock(ChatPostMessageResponse.class);
        when(messageResponse.isOk()).thenReturn(false);
        when(methods.chatPostMessage(any(ChatPostMessageRequest.class)))
                .thenThrow(IOException.class);

        final ArgumentCaptor<ChatPostMessageRequest> messageRequestArgCaptor =
                ArgumentCaptor.forClass(ChatPostMessageRequest.class);
        SlackMessage slackMessage = new SlackMessage(EXPECTED_MESSAGE, EXPECTED_CHAN_ID);

        // Act & Assert
        Assertions.assertThrows(
                IOException.class, () -> slackService.sendSlackMessage(slackMessage));

        verify(slack).methods(any());
        verify(methods).chatPostMessage(messageRequestArgCaptor.capture());

        ChatPostMessageRequest actualMessageRequest = messageRequestArgCaptor.getValue();
        Assertions.assertEquals(EXPECTED_SLACK_REQUEST, actualMessageRequest);
    }

    @Test
    void whenSlackApiExceptionOccurs_thenSendSlackMessageSlackApiException()
            throws IOException, SlackApiException {

        // Arrange (Prepare mocks)
        final String EXPECTED_CHAN_ID = "ChannelID";
        final String EXPECTED_MESSAGE = "MESSAGE";
        final ChatPostMessageRequest EXPECTED_SLACK_REQUEST =
                ChatPostMessageRequest.builder()
                        .channel(EXPECTED_CHAN_ID) // Use a channel ID `C1234567` is preferable
                        .text(EXPECTED_MESSAGE)
                        .build();
        final ChatPostMessageResponse messageResponse = mock(ChatPostMessageResponse.class);
        when(messageResponse.isOk()).thenReturn(false);
        when(methods.chatPostMessage(any(ChatPostMessageRequest.class)))
                .thenThrow(SlackApiException.class);

        final ArgumentCaptor<ChatPostMessageRequest> messageRequestArgCaptor =
                ArgumentCaptor.forClass(ChatPostMessageRequest.class);
        SlackMessage slackMessage = new SlackMessage(EXPECTED_MESSAGE, EXPECTED_CHAN_ID);

        // Act & Assert
        Assertions.assertThrows(
                SlackApiException.class, () -> slackService.sendSlackMessage(slackMessage));

        verify(slack).methods(any());
        verify(methods).chatPostMessage(messageRequestArgCaptor.capture());

        ChatPostMessageRequest actualMessageRequest = messageRequestArgCaptor.getValue();
        Assertions.assertEquals(EXPECTED_SLACK_REQUEST, actualMessageRequest);
    }

    @AfterAll
    static void tearDown() {
        mockedStaticSlack.close();
    }
}
